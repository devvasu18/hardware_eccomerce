const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getUserRelatedData } = require('../controllers/userController');
const { exportUsers } = require('../controllers/exportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/export', protect, admin, exportUsers);

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

router.get('/:id/related-data', protect, admin, getUserRelatedData);

module.exports = router;

