const express = require('express');
const router = express.Router();
const { getTurfs, getTurfById, createTurf, updateTurf, deleteTurf, getOwnerTurfs } = require('../controllers/turfController');
const { auth, isOwner } = require('../middleware/auth');

// Public routes
router.get('/', getTurfs);
router.get('/:id', getTurfById);

// Owner only routes
router.get('/owner/my', auth, isOwner, getOwnerTurfs);
router.post('/', auth, isOwner, createTurf);
router.put('/:id', auth, isOwner, updateTurf);
router.delete('/:id', auth, isOwner, deleteTurf);

module.exports = router;
