import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentOptions,
} from '../controllers/studentController';

const router = Router();

router.use(authMiddleware);

// Meta endpoint — returns valid levels, grades, courses for dropdowns
router.get('/meta/options', getStudentOptions);

router.post('/', createStudent);
router.get('/', listStudents);
router.get('/:id', getStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
