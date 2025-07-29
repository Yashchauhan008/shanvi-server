const express = require('express');
const router = express.Router();
const associateCompanyController = require('../controllers/associateCompanyController');

// All routes are prefixed with /api/associate-companies

router.post('/', associateCompanyController.createAssociateCompany);
router.get('/', associateCompanyController.getAllAssociateCompanies);
router.put('/:id', associateCompanyController.updateAssociateCompany);
router.delete('/:id', associateCompanyController.deleteAssociateCompany);

module.exports = router;
