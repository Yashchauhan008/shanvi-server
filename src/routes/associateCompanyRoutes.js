// const express = require('express');
// const router = express.Router();
// const associateCompanyController = require('../controllers/associateCompanyController');

// // All routes are prefixed with /api/associate-companies

// router.post('/', associateCompanyController.createAssociateCompany);
// router.get('/', associateCompanyController.getAllAssociateCompanies);
// router.put('/:id', associateCompanyController.updateAssociateCompany);
// router.delete('/:id', associateCompanyController.deleteAssociateCompany);

// module.exports = router;


const express = require('express');
const router = express.Router();
const associateCompanyController = require('../controllers/associateCompanyController');

// All routes are prefixed with /api/associate-companies

router.post('/', associateCompanyController.createAssociateCompany);
router.get('/', associateCompanyController.getAllAssociateCompanies);

// ✅ --- THIS IS THE FIX ---
// The route for getting a single company by ID must be added.
// It's important that '/:id' comes after any other specific GET routes.
router.get('/:id', associateCompanyController.getAssociateCompanyById);
// ✅ --- END OF FIX ---

router.put('/:id', associateCompanyController.updateAssociateCompany);
router.delete('/:id', associateCompanyController.deleteAssociateCompany);

module.exports = router;
