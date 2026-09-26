const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All product routes require valid tenant JWT
router.use(authenticate);

// Read routes (All roles can view inventory)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Staff, Revenue Manager, Admin can adjust live occupancy / check-in / check-out
router.patch(
  '/:id/occupancy',
  authorize('admin', 'revenue_manager', 'staff'),
  productController.updateOccupancy
);

// Admin & Revenue Manager can create and update products
router.post(
  '/',
  authorize('admin', 'revenue_manager'),
  productController.createProduct
);

router.put(
  '/:id',
  authorize('admin', 'revenue_manager'),
  productController.updateProduct
);

// Only Admin can delete products
router.delete(
  '/:id',
  authorize('admin'),
  productController.deleteProduct
);

module.exports = router;
