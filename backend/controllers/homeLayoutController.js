const HomeLayout = require('../models/HomeLayout');

// Get active layout for public frontend
exports.getActiveLayout = async (req, res) => {
    try {
        const layout = await HomeLayout.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json(layout);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching home layout', error: error.message });
    }
};

// Get all layout components for Admin
exports.getAllLayoutComponents = async (req, res) => {
    try {
        const layout = await HomeLayout.find().sort({ order: 1 });
        res.status(200).json(layout);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching home layout components', error: error.message });
    }
};

// Add new component to layout
exports.addComponent = async (req, res) => {
    try {
        const { componentType, config, order, isActive } = req.body;
        const newComponent = new HomeLayout({
            componentType,
            config,
            order,
            isActive
        });
        await newComponent.save();
        res.status(201).json(newComponent);
    } catch (error) {
        res.status(500).json({ message: 'Error adding component', error: error.message });
    }
};

// Update component
exports.updateComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedComponent = await HomeLayout.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedComponent) {
            return res.status(404).json({ message: 'Component not found' });
        }
        res.status(200).json(updatedComponent);
    } catch (error) {
        res.status(500).json({ message: 'Error updating component', error: error.message });
    }
};

// Reorder components
exports.reorderComponents = async (req, res) => {
    try {
        const { orders } = req.body; // Expecting [{id: string, order: number}, ...]
        const bulkOps = orders.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order }
            }
        }));
        await HomeLayout.bulkWrite(bulkOps);
        res.status(200).json({ message: 'Reordered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reordering components', error: error.message });
    }
};

// Delete component
exports.deleteComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedComponent = await HomeLayout.findByIdAndDelete(id);
        if (!deletedComponent) {
            return res.status(404).json({ message: 'Component not found' });
        }
        res.status(200).json({ message: 'Component deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting component', error: error.message });
    }
};
