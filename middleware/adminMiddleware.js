const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        // req.user is set by the authMiddleware
        if (!req.user) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin role required.' });
        }

        next();
    } catch (err) {
        console.error('Something wrong with admin middleware', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};