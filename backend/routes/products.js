const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  Product, Category, User, Review
} = require('../models');
const { Op } = require('sequelize');

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      condition,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const where = {
      status: 'active'
    };

    // Category filter
    if (category) {
      const categoryRecord = await Category.findOne({
        where: { 
          [Op.or]: [
            { name: category },
            { slug: category }
          ]
        }
      });
      if (categoryRecord) {
        where.category_id = categoryRecord.id;
      }
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    // Price filters
    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // Condition filter
    if (condition) {
      where.condition = condition;
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    const formattedProducts = products.rows.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      image: product.images?.[0] || '/api/placeholder/300/200',
      rating: parseFloat(product.rating_average) || 0,
      reviewCount: product.rating_count || 0,
      isFeatured: product.is_featured || false,
      condition: product.condition,
      brand: product.brand,
      seller: product.seller ? {
        id: product.seller.id,
        name: `${product.seller.first_name} ${product.seller.last_name}`,
        email: product.seller.email
      } : null,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      } : null,
      supportBonus: product.support_bonus_enabled ? product.support_bonus_percentage : 0,
      installments: product.installment_enabled ? product.max_installments : 0,
      minDownPayment: product.min_down_payment || 0,
      stock: product.stock_quantity,
      totalSales: product.total_sales || 0,
      createdAt: product.created_at
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        total: products.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(products.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get products'
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { 
        status: 'active'
      },
      order: [
        ['is_featured', 'DESC'],
        ['sort_order', 'ASC'],
        ['name', 'ASC']
      ]
    });

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isFeatured: category.is_featured,
      productCount: 0 // TODO: Add actual product count
    }));

    res.json({
      categories: formattedCategories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get categories'
    });
  }
});

// Search products (alternative endpoint)
// Registered before '/:id', which would otherwise match '/search' as an id.
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search query is required'
      });
    }

    const where = {
      status: 'active',
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { brand: { [Op.like]: `%${q}%` } }
      ]
    };

    if (category) {
      const categoryRecord = await Category.findOne({
        where: { 
          [Op.or]: [
            { name: category },
            { slug: category }
          ]
        }
      });
      if (categoryRecord) {
        where.category_id = categoryRecord.id;
      }
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      attributes: ['id', 'name', 'price', 'images', 'rating_average'],
      limit: parseInt(limit),
      order: [['rating_average', 'DESC'], ['total_sales', 'DESC']]
    });

    const suggestions = products.map(product => ({
      id: product.id,
      title: product.name,
      price: parseFloat(product.price),
      image: product.images?.[0] || '/api/placeholder/300/200',
      rating: parseFloat(product.rating_average) || 0,
      category: product.category?.name
    }));

    res.json({
      suggestions,
      query: q,
      total: suggestions.length
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search products'
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'email', 'created_at']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description']
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['id', 'rating', 'comment', 'created_at'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }
          ],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const formattedProduct = {
      id: product.id,
      title: product.name,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      images: product.images || ['/api/placeholder/300/200'],
      rating: parseFloat(product.rating_average) || 0,
      reviewCount: product.rating_count || 0,
      isFeatured: product.is_featured || false,
      condition: product.condition,
      brand: product.brand,
      specifications: product.specifications || {},
      features: product.features || [],
      seller: product.seller ? {
        id: product.seller.id,
        name: `${product.seller.first_name} ${product.seller.last_name}`,
        email: product.seller.email,
        memberSince: product.seller.created_at
      } : null,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description
      } : null,
      supportBonus: product.support_bonus_enabled ? product.support_bonus_percentage : 0,
      installments: product.installment_enabled ? product.max_installments : 0,
      minDownPayment: product.min_down_payment || 0,
      stock: product.stock_quantity,
      totalSales: product.total_sales || 0,
      reviews: product.reviews ? product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: review.user ? `${review.user.first_name} ${review.user.last_name}` : 'Anonymous'
      })) : [],
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };

    res.json({
      product: formattedProduct
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get product'
    });
  }
});

module.exports = router;