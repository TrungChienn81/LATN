const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const authController = require('../controllers/auth.controller');

router
  .route('/')
  .get(brandController.getAllBrands)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    brandController.createBrand
  );

router
  .route('/:id')
  .get(brandController.getBrand)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    brandController.updateBrand
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    brandController.deleteBrand
  );

module.exports = router;