const Turf = require('../models/Turf');

// GET /api/turfs (Get all turfs)
const getTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find();
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/turfs/:id (Get single turf)
const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    res.json(turf);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/turfs/owner/my (Get turfs owned by logged-in owner)
const getOwnerTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ owner: req.user.id });
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/turfs (Create turf - Owner only)
const createTurf = async (req, res) => {
  try {
    const { name, location, pricePerHour, description, images, availableSlots } = req.body;
    
    const turf = await Turf.create({
      name,
      location,
      pricePerHour,
      description,
      images,
      availableSlots: availableSlots || [],
      owner: req.user.id
    });

    res.status(201).json(turf);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/turfs/:id (Update turf - Owner only)
const updateTurf = async (req, res) => {
  try {
    let turf = await Turf.findById(req.params.id);
    
    if (!turf) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    
    // Check ownership
    if (turf.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this turf' });
    }
    
    turf = await Turf.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json(turf);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/turfs/:id (Delete turf - Owner only)
const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: 'Turf not found' });
    }
    
    // Check ownership
    if (turf.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this turf' });
    }
    
    await turf.deleteOne();
    
    res.json({ message: 'Turf deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTurfs,
  getTurfById,
  getOwnerTurfs,
  createTurf,
  updateTurf,
  deleteTurf
};
