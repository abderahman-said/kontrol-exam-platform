const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireTeacher } = require('../middlewares/auth');

router.use(requireTeacher);

router.get('/', groupController.getGroups);
router.post('/', groupController.createGroup);
router.get('/:id', groupController.getGroupById);
router.post('/:groupId/students', groupController.addStudent);
router.post('/:groupId/students/batch', groupController.addStudentsBatch);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
