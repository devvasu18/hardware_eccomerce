const Party = require('../models/Party');

// @desc    Get all parties
// @route   GET /api/admin/parties
// @access  Admin
exports.getParties = async (req, res) => {
    try {
        const parties = await Party.find({}).sort({ createdAt: -1 });
        res.json(parties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching parties', error: error.message });
    }
};

// @desc    Create party
// @route   POST /api/admin/parties
// @access  Admin
exports.createParty = async (req, res) => {
    try {
        const party = new Party(req.body);
        const createdParty = await party.save();
        res.status(201).json(createdParty);
    } catch (error) {
        res.status(400).json({ message: 'Error creating party', error: error.message });
    }
};

// @desc    Update party
// @route   PUT /api/admin/parties/:id
// @access  Admin
exports.updateParty = async (req, res) => {
    try {
        const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!party) return res.status(404).json({ message: 'Party not found' });
        res.json(party);
    } catch (error) {
        res.status(400).json({ message: 'Error updating party', error: error.message });
    }
};

// @desc    Delete party
// @route   DELETE /api/admin/parties/:id
// @access  Admin
exports.deleteParty = async (req, res) => {
    try {
        const party = await Party.findByIdAndDelete(req.params.id);
        if (!party) return res.status(404).json({ message: 'Party not found' });
        res.json({ message: 'Party deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting party', error: error.message });
    }
};
