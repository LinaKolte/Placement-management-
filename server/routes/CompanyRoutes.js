const express = require('express');
const { getCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');
const { authenticate, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCompanies);
router.post('/', authenticate, allowRoles('admin'), createCompany);
router.put('/:id', authenticate, allowRoles('admin'), updateCompany);
router.delete('/:id', authenticate, allowRoles('admin'), deleteCompany);

module.exports = router;