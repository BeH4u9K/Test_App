import React, { useState, useEffect } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { 
  Box, 
  CssBaseline, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Badge,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
  Menu,
  MenuItem,
  Switch,
  FormControl,
  InputLabel,
  Select,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import { grey, red, green, orange, blue } from '@mui/material/colors';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import TimelineIcon from '@mui/icons-material/Timeline';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuizIcon from '@mui/icons-material/Quiz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookIcon from '@mui/icons-material/Book';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import CreateIcon from '@mui/icons-material/Create';
import UpdateIcon from '@mui/icons-material/Update';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SendIcon from '@mui/icons-material/Send';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';





const drawerWidth = 240;
const API_BASE_URL = 'http://localhost:8081/api/v1';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: grey[900],
      paper: grey[800],
    },
    text: {
      primary: grey[100],
    },
    primary: {
      main: grey[400],
    },
    secondary: {
      main: grey[600],
    },
    error: {
      main: red[400],
    },
    success: {
      main: green[400],
    },
    warning: {
      main: orange[400],
    },
    info: {
      main: blue[400],
    },
  },
});

const menuItems = [
  { text: 'Профиль' },
  { text: 'Дисциплина' },
  { text: 'Участники' },
];

// Доступные роли в системе
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Администратор', icon: <AdminPanelSettingsIcon />, color: 'error' },
  { value: 'teacher', label: 'Преподаватель', icon: <SchoolOutlinedIcon />, color: 'warning' },
  { value: 'student', label: 'Студент', icon: <PersonIcon />, color: 'primary' },
];

function PersonalAccount() {


  const [activeTab, setActiveTab] = useState('Профиль');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [users, setUsers] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [disciplinesLoading, setDisciplinesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Состояния для модального окна просмотра пользователя
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState('');
  
  const [testAnswerOptions, setTestAnswerOptions] = useState([]);


  // Диалог редактирования ФИО
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editUserData, setEditUserData] = useState({
    id: '',
    currentName: '',
    newName: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Диалог редактирования ролей
  const [openRolesDialog, setOpenRolesDialog] = useState(false);
  const [editRolesData, setEditRolesData] = useState({
    id: '',
    currentRoles: [],
    newRoles: [],
  });
  const [rolesLoading, setRolesLoading] = useState(false);
  
  // Диалог блокировки пользователя
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [blockUserData, setBlockUserData] = useState({
    id: '',
    name: '',
    currentBlocked: false,
    newBlocked: false,
  });
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockStatuses, setBlockStatuses] = useState({});
  
  // Академическая информация пользователя
  const [academicTab, setAcademicTab] = useState(0);
  const [userDisciplines, setUserDisciplines] = useState([]);
  const [userTests, setUserTests] = useState([]);
  const [userMarks, setUserMarks] = useState([]);
  const [userAttempts, setUserAttempts] = useState([]);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState('');

  // Состояния для работы с дисциплинами
  const [disciplineDialog, setDisciplineDialog] = useState({
    open: false,
    mode: 'view',
    data: null,
    loading: false,
    error: ''
  });

  // Состояния для списка тестов дисциплины
  const [disciplineTestsDialog, setDisciplineTestsDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    tests: [],
    loading: false,
    error: ''
  });

  // Состояние для проверки активности теста
  const [testStateDialog, setTestStateDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    testId: null,
    testName: '',
    isActive: false,
    loading: false,
    error: ''
  });

  // Состояние для просмотра результатов попытки
const [viewAttemptDialog, setViewAttemptDialog] = useState({
  open: false,
  attemptId: null,
  userId: null,
  userName: '',
  testName: '',
  questions: [],
  userAnswers: {},
  score: 0,
  status: '',
  loading: false,
  error: ''
});

  // Состояние для активации/деактивации теста
  const [activateTestDialog, setActivateTestDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    testId: null,
    testName: '',
    currentActive: false,
    newActive: false,
    loading: false,
    error: ''
  });

  // Состояние для добавления нового теста
  const [addTestDialog, setAddTestDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    testName: '',
    description: '',
    loading: false,
    error: ''
  });

  // Состояние для удаления теста
  const [deleteTestDialog, setDeleteTestDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    testId: null,
    testName: '',
    loading: false,
    error: ''
  });

  // Новые состояния для студентов дисциплины
  const [disciplineStudentsDialog, setDisciplineStudentsDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    students: [],
    allStudents: [],
    loading: false,
    error: '',
    searchTerm: '',
    addStudentDialog: {
      open: false,
      studentId: '',
      loading: false,
      error: ''
    }
  });

  // Меню действий для теста
  const [testMenuAnchor, setTestMenuAnchor] = useState(null);
  const [selectedTestForMenu, setSelectedTestForMenu] = useState(null);
  const [selectedDisciplineForMenu, setSelectedDisciplineForMenu] = useState(null);

  // Детальная информация о дисциплине
  const [disciplineDetail, setDisciplineDetail] = useState(null);

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Состояние для удаления дисциплины
  const [deleteDisciplineDialog, setDeleteDisciplineDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    loading: false,
    error: ''
  });

  // Состояние для восстановления дисциплины
  const [restoreDisciplineDialog, setRestoreDisciplineDialog] = useState({
    open: false,
    disciplineId: null,
    disciplineName: '',
    loading: false,
    error: ''
  });

  // Флаг для показа удаленных дисциплин
  const [showDeleted, setShowDeleted] = useState(false);

  // Меню действий для дисциплины
  const [disciplineMenuAnchor, setDisciplineMenuAnchor] = useState(null);
  const [selectedDisciplineForAction, setSelectedDisciplineForAction] = useState(null);

  // ============= НОВЫЕ СОСТОЯНИЯ ДЛЯ СПИСКА ВОПРОСОВ =============
  // Состояние для списка вопросов теста
  const [questionsDialog, setQuestionsDialog] = useState({
    open: false,
    testId: null,
    testName: '',
    disciplineName: '',
    questions: [],
    loading: false,
    error: ''
  });

  // ============= НОВЫЕ СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ И СОЗДАНИЯ ВОПРОСОВ =============
  // Состояние для создания нового вопроса
  const [createQuestionDialog, setCreateQuestionDialog] = useState({
    open: false,
    testId: null,
    testName: '',
    title: '',
    questionText: '',
    answers: ['', '', '', ''],
    correctAnswerIndex: 0,
    loading: false,
    error: ''
  });

  // Состояние для редактирования вопроса
  const [editQuestionDialog, setEditQuestionDialog] = useState({
    open: false,
    questionId: null,
    currentTitle: '',
    currentQuestionText: '',
    currentAnswers: ['', '', '', ''],
    currentCorrectAnswerIndex: 0,
    currentVersion: 1,
    title: '',
    questionText: '',
    answers: ['', '', '', ''],
    correctAnswerIndex: 0,
    loading: false,
    error: ''
  });

  // Состояние для удаления вопроса
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState({
    open: false,
    questionId: null,
    questionTitle: '',
    loading: false,
    error: ''
  });

  // Меню действий для вопроса
  const [questionMenuAnchor, setQuestionMenuAnchor] = useState(null);
  const [selectedQuestionForMenu, setSelectedQuestionForMenu] = useState(null);

  // ============= НОВЫЕ СОСТОЯНИЯ ДЛЯ ДОБАВЛЕНИЯ ВОПРОСА В ТЕСТ =============
  // Состояние для добавления существующего вопроса в тест
  const [addQuestionToTestDialog, setAddQuestionToTestDialog] = useState({
    open: false,
    testId: null,
    testName: '',
    disciplineId: null,
    disciplineName: '',
    allQuestions: [], // Все доступные вопросы
    selectedQuestionId: '',
    loading: false,
    error: ''
  });

  // Состояние для изменения порядка вопросов
const [reorderQuestionsDialog, setReorderQuestionsDialog] = useState({
  open: false,
  testId: null,
  testName: '',
  disciplineId: null,
  disciplineName: '',
  questions: [],
  loading: false,
  error: ''
});


// Состояние для drag & drop
const [draggedQuestion, setDraggedQuestion] = useState(null);

useEffect(() => {
  const getMaxId = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/id`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();     // ожидается { id: 5 }
      setUserId(String(data.id));        // как и раньше
    } catch (e) {
      console.error('getMaxId error', e);
      showSnackbar(e.message, 'error');
    }
  };

  getMaxId();
}, []); 

const [userId, setUserId] = useState(null);

  // ============= ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ =============
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

// Добавьте в состояние startTestDialog поле для attempt_id
const [startTestDialog, setStartTestDialog] = useState({
  open: false,
  testId: null,
  testName: '',
  disciplineName: '',
  attemptId: null, // Добавьте это поле
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  loading: false,
  error: ''
});

  // ============= ОСНОВНЫЕ ФУНКЦИИ ЗАГРУЗКИ =============

  // Запись пользователя на дисциплину по точному API /disciplines/{disciplineID}/students/{userID}
const addStudentToDisciplineExact = async (disciplineId, userId) => {
  try {
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: { ...prev.addStudentDialog, loading: true, error: '' }
    }));

    console.log(`📡 POST /disciplines/${disciplineId}/students/${userId}`);
    
    const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/students/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Добавлен студент:', data);

    // Перезагружаем список студентов
    await fetchDisciplineStudents(disciplineId);
    showSnackbar('Студент записан на дисциплину!', 'success');
    
  } catch (err) {
    console.error('❌ Ошибка записи:', err);
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: { ...prev.addStudentDialog, error: err.message }
    }));
    showSnackbar(`Ошибка: ${err.message}`, 'error');
  }
};


  // Функция для инициализации теста (начало попытки)
const initializeTest = async (userId, testId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test_id: testId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Добавьте детальный лог для понимания структуры
    console.log('Полный ответ от сервера при начале теста:', data);
    
    if (data.questions && Array.isArray(data.questions)) {
      console.log('Первый вопрос детально:', data.questions[0]);
      if (data.questions[0].options) {
        console.log('Варианты ответа первого вопроса:', data.questions[0].options);
        console.log('ID вариантов ответа:', data.questions[0].options.map(opt => opt.id));
      }
    }
    
    return data;
    
  } catch (err) {
    console.error('Ошибка инициализации теста:', err);
    throw err;
  }
};

  // Загрузка профиля текущего пользователя
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        setError('');

        const [userResponse, blockResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${userId}`),
          fetch(`${API_BASE_URL}/users/${userId}/state`)
        ]);

        if (!userResponse.ok) {
          throw new Error(`HTTP ${userResponse.status}: Не удалось загрузить данные пользователя`);
        }
        
        const userData = await userResponse.json();
        console.log('Данные пользователя:', userData);
        
        // Проверяем статус блокировки
        let isBlocked = false;
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          isBlocked = blockData.is_blocked ?? false;
        }
        
        setUserName(userData.user_name || userData.full_name || userData.name || 'Неизвестный пользователь');
        setUserEmail(userData.email || userData.mail || 'Не указана');
        
        // Загружаем роли пользователя
        try {
          const rolesResponse = await fetch(`${API_BASE_URL}/users/${userId}/roles`);
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            setUserRoles(Array.isArray(rolesData) ? rolesData : []);
          } else {
            setUserRoles([]);
          }
        } catch (rolesError) {
          console.error('Ошибка загрузки ролей:', rolesError);
          setUserRoles([]);
        }
        
        // Сохраняем статус блокировки
        setBlockStatuses(prev => ({
          ...prev,
          [userId]: isBlocked
        }));
        
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setError(err.message);
        showSnackbar(`Ошибка загрузки профиля: ${err.message}`, 'error');
      } finally {
        setProfileLoading(false);
      }
    };

    if (activeTab === 'Профиль') {
      fetchUserProfile();
    }
  }, [activeTab, userId]);

  // Загрузка списка всех дисциплин
  const fetchDisciplines = async () => {
    try {
      setDisciplinesLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/disciplines`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDisciplines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки дисциплин:', err);
      setError(err.message);
      showSnackbar(`Ошибка загрузки дисциплин: ${err.message}`, 'error');
    } finally {
      setDisciplinesLoading(false);
    }
  };

  // Загрузка списка всех пользователей
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : [];
      
      // Загружаем дополнительную информацию для каждого пользователя
      const usersWithDetails = await Promise.all(
        usersArray.map(async (user) => {
          try {
            const [rolesResponse, blockResponse] = await Promise.all([
              fetch(`${API_BASE_URL}/users/${user.id}/roles`),
              fetch(`${API_BASE_URL}/users/${user.id}/state`)
            ]);
            
            let roles = [];
            let isBlocked = false;
            
            if (rolesResponse.ok) {
              const rolesData = await rolesResponse.json();
              roles = Array.isArray(rolesData) ? rolesData : [];
            }
            
            if (blockResponse.ok) {
              const blockData = await blockResponse.json();
              isBlocked = blockData.is_blocked ?? false;
            }
            
            // Обновляем статус блокировки
            setBlockStatuses(prev => ({
              ...prev,
              [user.id]: isBlocked
            }));
            
            return {
              ...user,
              roles,
              blocked: isBlocked
            };
            
          } catch (err) {
            console.error(`Ошибка загрузки информации для пользователя ${user.id}:`, err);
            return {
              ...user,
              roles: [],
              blocked: false
            };
          }
        })
      );
      
      setUsers(usersWithDetails);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError(err.message);
      showSnackbar(`Ошибка загрузки пользователей: ${err.message}`, 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Загрузка информации о конкретном пользователе
  const fetchUserById = async (id) => {
    try {
      setUserInfoLoading(true);
      setUserInfoError('');
      
      const [userResponse, rolesResponse, blockResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${id}`),
        fetch(`${API_BASE_URL}/users/${id}/roles`),
        fetch(`${API_BASE_URL}/users/${id}/state`)
      ]);
      
      if (!userResponse.ok) {
        throw new Error(`HTTP ${userResponse.status}: ${userResponse.statusText}`);
      }
      
      const userData = await userResponse.json();
      let rolesData = [];
      let isBlocked = false;
      
      if (rolesResponse.ok) {
        rolesData = await rolesResponse.json();
      }
      
      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        isBlocked = blockData.is_blocked ?? false;
      }
      
      // Обновляем статус блокировки
      setBlockStatuses(prev => ({
        ...prev,
        [id]: isBlocked
      }));
      
      setSelectedUserInfo({
        ...userData,
        roles: Array.isArray(rolesData) ? rolesData : [],
        blocked: isBlocked
      });
      
    } catch (err) {
      console.error('Ошибка загрузки информации о пользователе:', err);
      setUserInfoError(err.message);
      showSnackbar(`Ошибка загрузки информации о пользователе: ${err.message}`, 'error');
    } finally {
      setUserInfoLoading(false);
    }
  };

  // ============= ФУНКЦИИ ДЛЯ ДИСЦИПЛИН =============

  // 1. Получить детальную информацию о дисциплине
  const fetchDisciplineDetail = async (disciplineId) => {
    try {
      setDisciplineDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDisciplineDetail(data);
      
      if (disciplineDialog.data?.id === disciplineId) {
        setDisciplineDialog(prev => ({
          ...prev,
          data: { ...prev.data, ...data }
        }));
      }
      
      return data;
      
    } catch (err) {
      console.error('Ошибка загрузки информации о дисциплине:', err);
      setDisciplineDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка загрузки информации: ${err.message}`, 'error');
      throw err;
    } finally {
      setDisciplineDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // 2. Обновить информацию о дисциплине
  const updateDisciplineInfo = async (disciplineId, updates) => {
    try {
      setDisciplineDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список дисциплин
      setDisciplines(prev => 
        prev.map(d => d.id === disciplineId ? { ...d, ...updates } : d)
      );
      
      // Обновляем данные в диалоге
      if (disciplineDialog.data?.id === disciplineId) {
        setDisciplineDialog(prev => ({
          ...prev,
          data: { ...prev.data, ...updates },
          mode: 'view'
        }));
      }
      
      showSnackbar('Информация о дисциплине успешно обновлена!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка обновления дисциплины:', err);
      setDisciplineDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка обновления: ${err.message}`, 'error');
      throw err;
    } finally {
      setDisciplineDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // 3. Получить список тестов дисциплины
  const fetchDisciplineTests = async (disciplineId) => {
    try {
      setDisciplineTestsDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setDisciplineTestsDialog(prev => ({
        ...prev,
        tests: Array.isArray(data) ? data : [],
        loading: false
      }));
      
      return data;
      
    } catch (err) {
      console.error('Ошибка загрузки тестов дисциплины:', err);
      setDisciplineTestsDialog(prev => ({ 
        ...prev, 
        error: err.message,
        loading: false
      }));
      showSnackbar(`Ошибка загрузки тестов: ${err.message}`, 'error');
      throw err;
    }
  };

  // 4. Создать новую дисциплину
  const createDiscipline = async (disciplineData) => {
    try {
      setDisciplineDialog(prev => ({ ...prev, loading: true, error: '' }));
  const payload = {
    name: disciplineData.name?.trim(),
    description: disciplineData.description?.trim(),
    teacher_id: Number(userId), // гарантированно number
  };

  const response = await fetch(`${API_BASE_URL}/disciplines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список дисциплин
      fetchDisciplines();
      
      showSnackbar('Дисциплина успешно создана!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка создания дисциплины:', err);
      setDisciplineDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка создания: ${err.message}`, 'error');
      throw err;
    } finally {
      setDisciplineDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // 5. Проверить активность теста
  const fetchTestState = async (disciplineId, testId) => {
    try {
      setTestStateDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/state`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setTestStateDialog(prev => ({
        ...prev,
        isActive: data.active || data.state === 'active' || false,
        loading: false
      }));
      
      return data;
      
    } catch (err) {
      console.error('Ошибка загрузки статуса теста:', err);
      setTestStateDialog(prev => ({ 
        ...prev, 
        error: err.message,
        loading: false
      }));
      showSnackbar(`Ошибка загрузки статуса теста: ${err.message}`, 'error');
      throw err;
    }
  };

// 6. Активировать/деактивировать тест (ИСПРАВЛЕННЫЙ ВАРИАНТ)
const updateTestState = async (disciplineId, testId, active) => {
  try {
    setActivateTestDialog(prev => ({ ...prev, loading: true, error: '' }));
    
    const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_active: active  // ИЗМЕНЕНО: было "active", стало "is_active"
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Обновляем список тестов в диалоге
    if (disciplineTestsDialog.disciplineId === disciplineId) {
      fetchDisciplineTests(disciplineId);
    }
    
    showSnackbar(`Тест успешно ${active ? 'активирован' : 'деактивирован'}!`, 'success');
    return data;
    
  } catch (err) {
    console.error('Ошибка обновления статуса теста:', err);
    setActivateTestDialog(prev => ({ ...prev, error: err.message }));
    showSnackbar(`Ошибка обновления статуса теста: ${err.message}`, 'error');
    throw err;
  } finally {
    setActivateTestDialog(prev => ({ ...prev, loading: false }));
  }
};

  // 7. Добавить новый тест в дисциплину
  const addTestToDiscipline = async (disciplineId, testData) => {
    try {
      setAddTestDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список тестов в диалоге
      if (disciplineTestsDialog.disciplineId === disciplineId) {
        fetchDisciplineTests(disciplineId);
      }
      
      showSnackbar('Тест успешно добавлен!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка добавления теста:', err);
      setAddTestDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка добавления теста: ${err.message}`, 'error');
      throw err;
    } finally {
      setAddTestDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // 8. Удалить тест из дисциплины
  const deleteTestFromDiscipline = async (disciplineId, testId) => {
    try {
      setDeleteTestDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список тестов в диалоге
      if (disciplineTestsDialog.disciplineId === disciplineId) {
        fetchDisciplineTests(disciplineId);
      }
      
      showSnackbar('Тест успешно удален!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка удаления теста:', err);
      setDeleteTestDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка удаления теста: ${err.message}`, 'error');
      throw err;
    } finally {
      setDeleteTestDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============= ФУНКЦИИ ДЛЯ СТУДЕНТОВ ДИСЦИПЛИНЫ =============

  // 9. Получить список студентов дисциплины
  const fetchDisciplineStudents = async (disciplineId) => {
    try {
      setDisciplineStudentsDialog(prev => ({ 
        ...prev, 
        loading: true, 
        error: '',
        students: []
      }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/students`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Ответ от /students:', data);
      
      // Проверьте формат данных
      if (!Array.isArray(data)) {
        console.error('Ответ не является массивом:', typeof data, data);
        throw new Error('Некорректный формат данных студентов');
      }
      
      // Если данные уже содержат информацию о студентах
      if (data.length > 0 && typeof data[0] === 'object' && data[0].id) {
        // Формат: [{id: 1, name: "Иван", email: "ivan@example.com"}, ...]
        const studentsWithDetails = data.map(student => ({
          id: student.id,
          name: student.full_name || student.name || student.user_name || 'Неизвестный',
          email: student.email || student.mail || 'Не указан'
        }));
        
        setDisciplineStudentsDialog(prev => ({
          ...prev,
          students: studentsWithDetails,
          loading: false
        }));
        
        return studentsWithDetails;
      }
      
      // Если данные содержат только ID студентов
      if (data.length > 0 && typeof data[0] === 'number' || typeof data[0] === 'string') {
        // Формат: [1, 2, 3] или ["1", "2", "3"]
        const studentsWithDetails = await Promise.all(
          data.map(async (studentId) => {
            try {
              const studentResponse = await fetch(`${API_BASE_URL}/users/${studentId}`);
              if (studentResponse.ok) {
                const studentData = await studentResponse.json();
                return {
                  id: studentId,
                  name: studentData.full_name || studentData.name || studentData.user_name || 'Неизвестный',
                  email: studentData.email || studentData.mail || 'Не указан'
                };
              }
              return {
                id: studentId,
                name: 'Неизвестный',
                email: 'Не указан'
              };
            } catch (err) {
              console.error(`Ошибка загрузки информации о студенте ${studentId}:`, err);
              return {
                id: studentId,
                name: 'Ошибка загрузки',
                email: '—'
              };
            }
          })
        );
        
        setDisciplineStudentsDialog(prev => ({
          ...prev,
          students: studentsWithDetails,
          loading: false
        }));
        
        return studentsWithDetails;
      }
      
      throw new Error('Неизвестный формат данных студентов');
      
    } catch (err) {
      console.error('Ошибка загрузки студентов дисциплины:', err);
      setDisciplineStudentsDialog(prev => ({ 
        ...prev, 
        error: err.message,
        loading: false
      }));
      showSnackbar(`Ошибка загрузки студентов: ${err.message}`, 'error');
      throw err;
    }
  };

const addStudentToDiscipline = async (disciplineId, studentId) => {
  try {
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: { ...prev.addStudentDialog, loading: true, error: '' }
    }));

    const url = `${API_BASE_URL}/disciplines/${disciplineId}/students/${studentId}`;
    console.log('POST', url);

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    await fetchDisciplineStudents(disciplineId);
    showSnackbar('Пользователь записан на дисциплину!', 'success');
  } catch (err) {
    console.error('Ошибка записи пользователя:', err);
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: { ...prev.addStudentDialog, loading: false, error: err.message }
    }));
    showSnackbar(`Ошибка записи пользователя: ${err.message}`, 'error');
    throw err;
  }
};



  // 11. Отчислить пользователя с дисциплины
  const removeStudentFromDiscipline = async (disciplineId, studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Обновляем список студентов
      await fetchDisciplineStudents(disciplineId);
      
      showSnackbar('Пользователь успешно отчислен с дисциплины!', 'success');
      return true;
      
    } catch (err) {
      console.error('Ошибка отчисления пользователя с дисциплины:', err);
      showSnackbar(`Ошибка отчисления пользователя: ${err.message}`, 'error');
      throw err;
    }
  };

  // 12. Загрузить список всех пользователей для выбора
  const fetchAllUsersForSelection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : [];
      
      // Фильтруем только студентов (можно добавить дополнительную логику фильтрации)
      const filteredUsers = usersArray.filter(user => 
        !user.roles || 
        user.roles.includes('student') || 
        (!user.roles.includes('admin') && !user.roles.includes('teacher'))
      );
      
      setDisciplineStudentsDialog(prev => ({
        ...prev,
        allStudents: filteredUsers.map(user => ({
          id: user.id,
          name: user.full_name || user.name || 'Неизвестный',
          email: user.email || user.mail || 'Не указан'
        }))
      }));
      
      return filteredUsers;
      
    } catch (err) {
      console.error('Ошибка загрузки пользователей для выбора:', err);
      showSnackbar(`Ошибка загрузки пользователей: ${err.message}`, 'error');
      throw err;
    }
  };

  // ============= ФУНКЦИИ ДЛЯ МЯГКОГО УДАЛЕНИЯ ДИСЦИПЛИНЫ =============

  // 13. Отметить дисциплину как удаленную (мягкое удаление)
  const deleteDiscipline = async (disciplineId) => {
    try {
      setDeleteDisciplineDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список дисциплин
      setDisciplines(prev => 
        prev.map(d => d.id === disciplineId ? { ...d, deleted: true } : d)
      );
      
      // Закрываем все открытые диалоги для этой дисциплины
      if (disciplineDialog.data?.id === disciplineId) {
        handleCloseDisciplineDialog();
      }
      
      showSnackbar('Дисциплина успешно удалена!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка удаления дисциплины:', err);
      setDeleteDisciplineDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка удаления дисциплины: ${err.message}`, 'error');
      throw err;
    } finally {
      setDeleteDisciplineDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // 14. Восстановить дисциплину (отменить мягкое удаление)
  const restoreDiscipline = async (disciplineId) => {
    try {
      setRestoreDisciplineDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/restore`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список дисциплин
      setDisciplines(prev => 
        prev.map(d => d.id === disciplineId ? { ...d, deleted: false } : d)
      );
      
      showSnackbar('Дисциплина успешно восстановлена!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка восстановления дисциплины:', err);
      setRestoreDisciplineDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка восстановления дисциплины: ${err.message}`, 'error');
      throw err;
    } finally {
      setRestoreDisciplineDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============= ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЕЙ =============

  // Изменение ФИО пользователя
  const updateUserName = async (userId, newName) => {
    try {
      setSaveLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      showSnackbar('ФИО успешно изменено!', 'success');
      
      // Обновить данные в UI
      if (selectedUserInfo?.id === userId) {
        setSelectedUserInfo({
          ...selectedUserInfo,
          full_name: newName,
        });
      }
      
      if (activeTab === 'Участники') {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, full_name: newName }
              : user
          )
        );
      }
      
      if (userId === '3') {
        setUserName(newName);
      }
      
      return result;
      
    } catch (err) {
      console.error('Ошибка обновления ФИО:', err);
      showSnackbar(`Ошибка: ${err.message}`, 'error');
      throw err;
    } finally {
      setSaveLoading(false);
    }
  };

  // Изменение ролей пользователя
  const updateUserRoles = async (userId, newRoles) => {
    try {
      setRolesLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: newRoles,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      showSnackbar('Роли успешно обновлены!', 'success');
      
      // Обновить данные в UI
      if (selectedUserInfo?.id === userId) {
        setSelectedUserInfo({
          ...selectedUserInfo,
          roles: newRoles,
        });
      }
      
      if (activeTab === 'Участники') {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, roles: newRoles }
              : user
          )
        );
      }
      
      if (userId === '3') {
        setUserRoles(newRoles);
      }
      
      return result;
      
    } catch (err) {
      console.error('Ошибка обновления ролей:', err);
      showSnackbar(`Ошибка: ${err.message}`, 'error');
      throw err;
    } finally {
      setRolesLoading(false);
    }
  };

  // Изменение статуса блокировки пользователя
const updateUserBlockStatus = async (userId, blocked, reason) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      is_blocked: blocked,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return await response.json();
};

  // ============= ФУНКЦИИ ДЛЯ ЗАГРУЗКИ СПИСКА ВОПРОСОВ =============

  // Получить список вопросов теста (с фильтрацией последней версии)
  const fetchTestQuestions = async (disciplineId, testId) => {
    try {
      setQuestionsDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      // Измененный URL: http://localhost:8081/api/v1/disciplines/1/tests/1/questions
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/questions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const allQuestions = await response.json();
      
      // Фильтруем вопросы, оставляя только последние версии
      const filteredQuestions = filterLatestQuestionVersions(allQuestions);
      
      setQuestionsDialog(prev => ({
        ...prev,
        questions: filteredQuestions,
        loading: false
      }));
      
      return filteredQuestions;
      
    } catch (err) {
      console.error('Ошибка загрузки вопросов теста:', err);
      setQuestionsDialog(prev => ({ 
        ...prev, 
        error: err.message,
        loading: false
      }));
      showSnackbar(`Ошибка загрузки вопросов: ${err.message}`, 'error');
      throw err;
    }
  };

  // Функция для фильтрации последних версий вопросов
  const filterLatestQuestionVersions = (questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return [];
    }
    
    // Группируем вопросы по названию
    const questionGroups = {};
    
    questions.forEach(question => {
      const questionName = question.name || question.question_name || question.title || 'Без названия';
      const questionId = question.question_id || question.id;
      const version = question.version || 1;
      const authorId = question.author_id || question.created_by || null;
      
      if (!questionGroups[questionName]) {
        questionGroups[questionName] = [];
      }
      
      questionGroups[questionName].push({
        id: questionId,
        name: questionName,
        version,
        authorId,
        rawQuestion: question
      });
    });
    
    // Для каждой группы оставляем только последнюю версию
    const result = [];
    
    Object.values(questionGroups).forEach(group => {
      if (group.length > 0) {
        // Сортируем по версии в порядке убывания
        const sortedGroup = [...group].sort((a, b) => b.version - a.version);
        result.push(sortedGroup[0]); // Берем первый элемент (самая новая версия)
      }
    });
    
    return result;
  };

  // ============= НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ВОПРОСАМИ =============

    // Функция для загрузки результатов попытки теста
const fetchAttemptResults = async (userId, attemptId) => {
  try {
    setViewAttemptDialog(prev => ({ ...prev, loading: true, error: '' }));
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}/attempts/${attemptId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Преобразуем данные в удобный формат
    const formattedQuestions = data.answers?.map((answer, index) => ({
      id: index,
      question_text: answer.question_text || `Вопрос ${index + 1}`,
      user_answer: answer.answer_text || '',
      is_correct: answer.is_correct || false,
      correct_answer: answer.correct_answer || ''
    })) || [];
    
    setViewAttemptDialog(prev => ({
      ...prev,
      questions: formattedQuestions,
      userAnswers: formattedQuestions.reduce((acc, question, index) => {
        acc[index] = question.user_answer;
        return acc;
      }, {}),
      score: data.score || 0,
      status: data.status || 'completed',
      loading: false
    }));
    
    return data;
    
  } catch (err) {
    console.error('Ошибка загрузки результатов попытки:', err);
    setViewAttemptDialog(prev => ({ 
      ...prev, 
      error: err.message,
      loading: false
    }));
    showSnackbar(`Ошибка загрузки результатов: ${err.message}`, 'error');
    throw err;
  }
};

  // 15. Создать новый вопрос
const createQuestion = async (testId, questionData) => {
  try {
    setCreateQuestionDialog(prev => ({ ...prev, loading: true, error: '' }));
    const disciplineId = questionsDialog.disciplineId; // Из контекста диалога
    if (!disciplineId) throw new Error('Discipline ID не найден');
    
const requestData = {
  title: questionData.title,
  text: questionData.questionText,
  answers: questionData.answers.map((answerText, index) => ({
    text: answerText.trim(),
    is_correct: index === parseInt(questionData.correctAnswerIndex)
  }))
};
    const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/questions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData),
});
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${errorData.message || 'HTTP'} ${response.status}`);
    }
    
    const data = await response.json();
    if (questionsDialog.testId === testId && disciplineId) {
      await fetchTestQuestions(disciplineId, testId); // Рефреш списка
    }
    showSnackbar('Вопрос создан!', 'success');
    return data;
  } catch (err) {
    console.error('createQuestion error:', err);
    setCreateQuestionDialog(prev => ({ ...prev, error: err.message }));
    showSnackbar(err.message, 'error');
    throw err;
  } finally {
    setCreateQuestionDialog(prev => ({ ...prev, loading: false }));
  }
};


// 16. Изменить вопрос (создать новую версию)
const updateQuestion = async (questionId, questionData) => {
  try {
    setEditQuestionDialog(prev => ({ ...prev, loading: true, error: '' }));
    
    // Формируем данные для обновления
    const requestData = {
      title: questionData.title,
      question_text: questionData.questionText,
      answers: questionData.answers.filter(answer => answer.trim() !== ''), // Убираем пустые ответы
      correct_answer: questionData.correctAnswerIndex,
      version: questionData.currentVersion + 1 // Увеличиваем версию
    };
    
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Обновляем список вопросов в диалоге
    if (questionsDialog.testId) {
      // Перезагружаем вопросы
      const disciplineId = questionsDialog.disciplineId;
      if (disciplineId) {
        await fetchTestQuestions(disciplineId, questionsDialog.testId);
      }
    }
    
    showSnackbar('Вопрос успешно обновлен!', 'success');
    return data;
    
  } catch (err) {
    console.error('Ошибка обновления вопроса:', err);
    setEditQuestionDialog(prev => ({ ...prev, error: err.message }));
    showSnackbar(`Ошибка обновления вопроса: ${err.message}`, 'error');
    throw err;
  } finally {
    setEditQuestionDialog(prev => ({ ...prev, loading: false }));
  }
};

  // 17. Удалить вопрос (мягкое удаление)
  const deleteQuestion = async (questionId) => {
    try {
      setDeleteQuestionDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список вопросов в диалоге
      if (questionsDialog.testId) {
        // Перезагружаем вопросы
        const disciplineId = questionsDialog.disciplineId;
        if (disciplineId) {
          await fetchTestQuestions(disciplineId, questionsDialog.testId);
        }
      }
      
      showSnackbar('Вопрос успешно удален!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка удаления вопроса:', err);
      setDeleteQuestionDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка удаления вопроса: ${err.message}`, 'error');
      throw err;
    } finally {
      setDeleteQuestionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============= НОВЫЕ ФУНКЦИИ ДЛЯ ДОБАВЛЕНИЯ ВОПРОСА В ТЕСТ =============

  // 18. Проверить, есть ли попытки прохождения теста
  const checkTestAttempts = async (testId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}/attempts`);
      
      if (!response.ok) {
        // Если тест не имеет попыток, API может вернуть ошибку или пустой массив
        if (response.status === 404) {
          return []; // Нет попыток
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
      
    } catch (err) {
      console.error('Ошибка проверки попыток теста:', err);
      // Если возникает ошибка, предполагаем что попыток нет
      return [];
    }
  };

  // 19. Получить список всех доступных вопросов
  const fetchAllQuestions = async () => {
    try {
      // Запрашиваем все вопросы из системы
      const response = await fetch(`${API_BASE_URL}/questions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Фильтруем только последние версии вопросов
      const filteredQuestions = filterLatestQuestionVersions(data);
      
      setAddQuestionToTestDialog(prev => ({
        ...prev,
        allQuestions: filteredQuestions,
        loading: false
      }));
      
      return filteredQuestions;
      
    } catch (err) {
      console.error('Ошибка загрузки всех вопросов:', err);
      setAddQuestionToTestDialog(prev => ({ 
        ...prev, 
        error: err.message,
        loading: false
      }));
      showSnackbar(`Ошибка загрузки вопросов: ${err.message}`, 'error');
      throw err;
    }
  };

  // 20. Добавить вопрос в тест (если нет попыток)
  const addQuestionToTest = async (testId, questionId) => {
    try {
      setAddQuestionToTestDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      // Проверяем, есть ли попытки прохождения теста
      const attempts = await checkTestAttempts(testId);
      
      if (attempts.length > 0) {
        throw new Error('Невозможно добавить вопрос: тест уже имеет попытки прохождения');
      }
      
      // Добавляем вопрос в тест в последнюю позицию
      const response = await fetch(`${API_BASE_URL}/tests/${testId}/questions/${questionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: -1 // -1 означает добавить в конец
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Обновляем список вопросов в диалоге
      if (questionsDialog.testId === testId) {
        // Перезагружаем вопросы
        const disciplineId = questionsDialog.disciplineId;
        if (disciplineId) {
          await fetchTestQuestions(disciplineId, testId);
        }
      }
      
      showSnackbar('Вопрос успешно добавлен в тест!', 'success');
      return data;
      
    } catch (err) {
      console.error('Ошибка добавления вопроса в тест:', err);
      setAddQuestionToTestDialog(prev => ({ ...prev, error: err.message }));
      showSnackbar(`Ошибка добавления вопроса в тест: ${err.message}`, 'error');
      throw err;
    } finally {
      setAddQuestionToTestDialog(prev => ({ ...prev, loading: false }));
    }
  };
  const checkTestAttemptsForReorder = async (testId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/attempts`);
    
    if (!response.ok) {
      // Если тест не имеет попыток, API может вернуть ошибку или пустой массив
      if (response.status === 404) {
        return []; // Нет попыток
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
    
  } catch (err) {
    console.error('Ошибка проверки попыток теста для изменения порядка:', err);
    // Если возникает ошибка, предполагаем что попыток нет
    return [];
  }
};

// 22. Изменить порядок вопросов в тесте
const reorderTestQuestions = async (testId, questionOrder) => {
  try {
    setReorderQuestionsDialog(prev => ({ ...prev, loading: true, error: '' }));
    
    // Проверяем, есть ли попытки прохождения теста
    const attempts = await checkTestAttemptsForReorder(testId);
    
    if (attempts.length > 0) {
      throw new Error('Невозможно изменить порядок вопросов: тест уже имеет попытки прохождения');
    }
    
    // Отправляем новый порядок вопросов
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/questions/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_order: questionOrder
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Обновляем список вопросов в диалоге
    if (questionsDialog.testId === testId) {
      // Перезагружаем вопросы
      const disciplineId = questionsDialog.disciplineId;
      if (disciplineId) {
        await fetchTestQuestions(disciplineId, testId);
      }
    }
    
    showSnackbar('Порядок вопросов успешно изменен!', 'success');
    return data;
    
  } catch (err) {
    console.error('Ошибка изменения порядка вопросов:', err);
    setReorderQuestionsDialog(prev => ({ ...prev, error: err.message }));
    showSnackbar(`Ошибка изменения порядка вопросов: ${err.message}`, 'error');
    throw err;
  } finally {
    setReorderQuestionsDialog(prev => ({ ...prev, loading: false }));
  }
};


// 23. Получить список пользователей, прошедших тест
const fetchTestUsers = async (testId) => {
  try {
    setTestUsersDialog(prev => ({ ...prev, loading: true, error: '', users: [] }));
    
    // Получаем все попытки по тесту
    const attemptsResponse = await fetch(`${API_BASE_URL}/tests/${testId}/attempts`);
    
    if (!attemptsResponse.ok) {
      throw new Error(`HTTP ${attemptsResponse.status}: ${attemptsResponse.statusText}`);
    }
    
    const attempts = await attemptsResponse.json();
    
    if (!Array.isArray(attempts) || attempts.length === 0) {
      setTestUsersDialog(prev => ({ ...prev, loading: false, users: [] }));
      return [];
    }
    
    // Группируем попытки по пользователям
    const userAttemptsMap = {};
    
    attempts.forEach(attempt => {
      const userId = attempt.user_id;
      if (!userAttemptsMap[userId]) {
        userAttemptsMap[userId] = [];
      }
      userAttemptsMap[userId].push({
        id: attempt.id,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        score: attempt.score || 0
      });
    });
    
    // Получаем информацию о пользователях
    const usersWithDetails = await Promise.all(
      Object.keys(userAttemptsMap).map(async (userId) => {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            return {
              id: userId,
              name: userData.full_name || userData.name || 'Неизвестный',
              email: userData.email || userData.mail || 'Не указан',
              attempts: userAttemptsMap[userId],
              // Вычисляем лучшую оценку
              bestScore: Math.max(...userAttemptsMap[userId].map(a => a.score || 0)),
              // Вычисляем количество попыток
              attemptsCount: userAttemptsMap[userId].length,
              // Последняя попытка
              lastAttempt: userAttemptsMap[userId].reduce((latest, current) => {
                const currentTime = new Date(current.completed_at || current.started_at);
                const latestTime = new Date(latest.completed_at || latest.started_at);
                return currentTime > latestTime ? current : latest;
              })
            };
          }
          return {
            id: userId,
            name: 'Неизвестный пользователь',
            email: 'Не указан',
            attempts: userAttemptsMap[userId],
            bestScore: Math.max(...userAttemptsMap[userId].map(a => a.score || 0)),
            attemptsCount: userAttemptsMap[userId].length
          };
        } catch (err) {
          console.error(`Ошибка загрузки пользователя ${userId}:`, err);
          return {
            id: userId,
            name: 'Ошибка загрузки',
            email: '—',
            attempts: userAttemptsMap[userId],
            bestScore: 0,
            attemptsCount: userAttemptsMap[userId].length
          };
        }
      })
    );
    
    // Сортируем по лучшей оценке (по убыванию)
    usersWithDetails.sort((a, b) => b.bestScore - a.bestScore);
    
    setTestUsersDialog(prev => ({
      ...prev,
      users: usersWithDetails,
      loading: false
    }));
    
    return usersWithDetails;
    
  } catch (err) {
    console.error('Ошибка загрузки пользователей теста:', err);
    setTestUsersDialog(prev => ({ 
      ...prev, 
      error: err.message,
      loading: false
    }));
    showSnackbar(`Ошибка загрузки пользователей теста: ${err.message}`, 'error');
    throw err;
  }
};

// 24. Получить ответы пользователя в конкретной попытке
const fetchUserAttemptAnswers = async (attemptId) => {
  try {
    setUserAttemptDialog(prev => ({ ...prev, loading: true, error: '', answers: [] }));
    
    // Предполагаем, что API возвращает ответы пользователя
    // Если API не поддерживает эту функцию, нужно адаптировать
    const response = await fetch(`${API_BASE_URL}/attempts/${attemptId}/answers`);
    
    if (!response.ok) {
      // Если endpoint не существует, возвращаем заглушку
      if (response.status === 404) {
        // Генерируем тестовые данные для демонстрации
        return generateMockAnswers();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const answers = await response.json();
    
    setUserAttemptDialog(prev => ({
      ...prev,
      answers: Array.isArray(answers) ? answers : [],
      loading: false
    }));
    
    return answers;
    
  } catch (err) {
    console.error('Ошибка загрузки ответов пользователя:', err);
    setUserAttemptDialog(prev => ({ 
      ...prev, 
      error: err.message,
      loading: false
    }));
    showSnackbar(`Ошибка загрузки ответов: ${err.message}`, 'error');
    throw err;
  }
};

// Функция для завершения теста (отправки ответов)
const completeTestAttempt = async (userId, attemptId, answers) => {
  try {
    // URL: http://localhost:8081/api/v1/users/{userID}/attempts/{attemptID}
    const response = await fetch(`${API_BASE_URL}/users/${userId}/attempts/${attemptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: answers
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (err) {
    console.error('Ошибка завершения теста:', err);
    throw err;
  }
};

// Вспомогательная функция для генерации тестовых данных (если API не готово)
// 

// 25. Проверить, является ли пользователь преподавателем на курсе
const checkIsTeacherOnCourse = async (userId, disciplineId) => {
  try {
    // Здесь должна быть логика проверки роли преподавателя
    // Для демонстрации считаем, что текущий пользователь - преподаватель
    return true;
    
    // Реальная реализация:
    // const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/teachers`);
    // if (response.ok) {
    //   const teachers = await response.json();
    //   return teachers.includes(parseInt(userId));
    // }
    // return false;
  } catch (err) {
    console.error('Ошибка проверки роли преподавателя:', err);
    return false;
  }
};

  // ============= ОБРАБОТЧИКИ СОБЫТИЙ =============

  // Обработчик для просмотра результатов попытки
const handleViewAttemptResults = async (userId, attemptId, userName = '', testName = '') => {
  setViewAttemptDialog({
    open: true,
    attemptId,
    userId,
    userName,
    testName,
    questions: [],
    userAnswers: {},
    score: 0,
    status: '',
    loading: true,
    error: ''
  });
  
  try {
    await fetchAttemptResults(userId, attemptId);
  } catch (err) {
    // Ошибка уже обработана в fetchAttemptResults
  }
};

  // Обработчик для открытия списка пользователей, прошедших тест
const handleViewTestUsersClick = () => {
  setTestUsersDialog({
    open: true,
    testId: questionsDialog.testId,
    testName: questionsDialog.testName,
    disciplineId: questionsDialog.disciplineId,
    disciplineName: questionsDialog.disciplineName,
    users: [],
    loading: true,
    error: ''
  });
  
  // Загружаем пользователей
  fetchTestUsers(questionsDialog.testId);
};

// Обработчик для открытия детальной информации о попытке пользователя
const handleViewUserAttempts = async (user) => {
  setUserAttemptDialog({
    open: true,
    userId: user.id,
    userName: user.name,
    testId: testUsersDialog.testId,
    testName: testUsersDialog.testName,
    attempts: user.attempts,
    selectedAttempt: user.attempts[0], // Выбираем первую попытку по умолчанию
    answers: [],
    loading: false,
    error: ''
  });
  
  // Проверяем права доступа
  const isTeacher = await checkIsTeacherOnCourse(userId, testUsersDialog.disciplineId);
  
  if (!isTeacher) {
    showSnackbar('Только преподаватели могут просматривать ответы пользователей', 'warning');
  }
};

// Обработчик для выбора конкретной попытки
const handleSelectAttempt = (attempt) => {
  setUserAttemptDialog(prev => ({
    ...prev,
    selectedAttempt: attempt,
    answers: [],
    loading: true
  }));
  
  // Загружаем ответы для выбранной попытки
  fetchUserAttemptAnswers(attempt.id);
};

// Обработчик для закрытия диалога пользователей теста
const handleCloseTestUsersDialog = () => {
  setTestUsersDialog({
    open: false,
    testId: null,
    testName: '',
    disciplineId: null,
    disciplineName: '',
    users: [],
    loading: false,
    error: ''
  });
  setSearchTerm('');
};

// Обработчик для закрытия диалога попыток пользователя
const handleCloseUserAttemptDialog = () => {
  setUserAttemptDialog({
    open: false,
    userId: null,
    userName: '',
    testId: null,
    testName: '',
    attempts: [],
    selectedAttempt: null,
    answers: [],
    loading: false,
    error: ''
  });
};

// Фильтрация пользователей по поисковому запросу
const getFilteredUsers = () => {
  const { users } = testUsersDialog;
  
  if (!searchTerm.trim()) {
    return users;
  }
  
  const term = searchTerm.toLowerCase();
  return users.filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term) ||
    user.id.toString().includes(term)
  );
};

  // Обработчик для открытия диалога изменения порядка вопросов
const handleReorderQuestionsClick = () => {
  // Проверяем, есть ли вопросы для упорядочивания
  if (!questionsDialog.questions || questionsDialog.questions.length === 0) {
    showSnackbar('Нет вопросов для изменения порядка', 'warning');
    return;
  }
  
  setReorderQuestionsDialog({
    open: true,
    testId: questionsDialog.testId,
    testName: questionsDialog.testName,
    disciplineId: questionsDialog.disciplineId,
    disciplineName: questionsDialog.disciplineName,
    questions: [...questionsDialog.questions], // Копируем вопросы
    loading: false,
    error: ''
  });
};

// Обработчик для сохранения нового порядка вопросов
const handleSaveQuestionOrder = async () => {
  try {
    // Создаем массив ID вопросов в новом порядке
    const questionOrder = reorderQuestionsDialog.questions.map(q => q.id);
    
    await reorderTestQuestions(
      reorderQuestionsDialog.testId,
      questionOrder
    );
    handleCloseReorderQuestionsDialog();
  } catch (err) {
    // Ошибка уже обработана
  }
};

// Обработчик для закрытия диалога изменения порядка
const handleCloseReorderQuestionsDialog = () => {
  setReorderQuestionsDialog({
    open: false,
    testId: null,
    testName: '',
    disciplineId: null,
    disciplineName: '',
    questions: [],
    loading: false,
    error: ''
  });
  setDraggedQuestion(null);
};

// Обработчики для drag & drop
const handleDragStart = (event, question, index) => {
  setDraggedQuestion({ question, index });
  event.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (event, index) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

const handleDrop = (event, targetIndex) => {
  event.preventDefault();
  
  if (draggedQuestion === null) return;
  
  const sourceIndex = draggedQuestion.index;
  if (sourceIndex === targetIndex) return;
  
  // Создаем новый массив вопросов
  const newQuestions = [...reorderQuestionsDialog.questions];
  
  // Удаляем элемент из старой позиции
  const [removed] = newQuestions.splice(sourceIndex, 1);
  
  // Вставляем элемент в новую позицию
  newQuestions.splice(targetIndex, 0, removed);
  
  // Обновляем состояние
  setReorderQuestionsDialog(prev => ({
    ...prev,
    questions: newQuestions
  }));
  
  setDraggedQuestion(null);
};

  // Обработчики для дисциплин
  const handleViewDisciplineClick = async (discipline) => {
    setDisciplineDialog({
      open: true,
      mode: 'view',
      data: discipline,
      loading: true,
      error: ''
    });
    
    try {
      await fetchDisciplineDetail(discipline.id);
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  const handleCreateDisciplineClick = () => {
    setDisciplineDialog({
      open: true,
      mode: 'create',
      data: {
        name: '',
        description: '',
        teacher_id: ''
      },
      loading: false,
      error: ''
    });
  };

  const handleViewDisciplineTests = async (discipline) => {
    setDisciplineTestsDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      tests: [],
      loading: true,
      error: ''
    });
    
    try {
      await fetchDisciplineTests(discipline.id);
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчик для просмотра вопросов теста
  const handleViewTestQuestions = async (test, disciplineName = '', disciplineId = null) => {
    // Получаем ID дисциплины из контекста
    const actualDisciplineId = disciplineId || disciplineTestsDialog.disciplineId;
    
    if (!actualDisciplineId) {
      showSnackbar('Ошибка: не указан ID дисциплины', 'error');
      return;
    }
    
    setQuestionsDialog({
      open: true,
      testId: test.id,
      testName: test.name || 'Без названия',
      disciplineName: disciplineName || test.discipline_name || '',
      disciplineId: actualDisciplineId, // Сохраняем ID дисциплины
      questions: [],
      loading: true,
      error: ''
    });
    
    try {
      await fetchTestQuestions(actualDisciplineId, test.id);
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Новые обработчики для студентов дисциплины
  const handleViewDisciplineStudents = async (discipline) => {
    setDisciplineStudentsDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      students: [],
      allStudents: [],
      loading: true,
      error: '',
      searchTerm: '',
      addStudentDialog: {
        open: false,
        studentId: '',
        loading: false,
        error: ''
      }
    });
    
    try {
      await fetchDisciplineStudents(discipline.id);
      // Загружаем всех пользователей для выбора
      await fetchAllUsersForSelection();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  const handleOpenAddStudentDialog = () => {
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: {
        ...prev.addStudentDialog,
        open: true,
        studentId: '',
        loading: false,
        error: ''
      }
    }));
  };

  const handleCloseAddStudentDialog = () => {
    setDisciplineStudentsDialog(prev => ({
      ...prev,
      addStudentDialog: {
        ...prev.addStudentDialog,
        open: false,
        studentId: '',
        loading: false,
        error: ''
      }
    }));
  };

const handleAddStudentToDiscipline = async () => {
  const studentId = disciplineStudentsDialog.addStudentDialog.studentId;
  if (!studentId?.toString().trim()) {
    showSnackbar('Выберите пользователя!', 'warning');
    return;
  }

  try {
    await addStudentToDiscipline(disciplineStudentsDialog.disciplineId, studentId);
    handleCloseAddStudentDialog();
  } catch (err) {
    console.error('handleAddStudentToDiscipline error:', err);
  }
};

  const handleRemoveStudentFromDiscipline = async (studentId) => {
    if (!confirm(`Вы уверены, что хотите отчислить студента с ID ${studentId} с дисциплины?`)) {
      return;
    }
    
    try {
      await removeStudentFromDiscipline(
        disciplineStudentsDialog.disciplineId,
        studentId
      );
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчик для проверки активности теста
  const handleCheckTestState = async (discipline, test) => {
    setTestStateDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      testId: test.id,
      testName: test.name || 'Без названия',
      isActive: false,
      loading: true,
      error: ''
    });
    
    try {
      await fetchTestState(discipline.id, test.id);
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчик для активации/деактивации теста
  const handleActivateTestClick = (discipline, test) => {
    setActivateTestDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      testId: test.id,
      testName: test.name || 'Без названия',
      currentActive: test.state === 'active',
      newActive: test.state !== 'active',
      loading: false,
      error: ''
    });
  };

  // Обработчик для добавления теста
  const handleAddTestClick = (discipline) => {
    setAddTestDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      testName: '',
      description: '',
      loading: false,
      error: ''
    });
  };

  // Обработчик для удаления теста
  const handleDeleteTestClick = (discipline, test) => {
    setDeleteTestDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      testId: test.id,
      testName: test.name || 'Без названия',
      loading: false,
      error: ''
    });
  };

  // ============= НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ВОПРОСОВ =============

  // Обработчик для создания вопроса
  const handleCreateQuestionClick = () => {
    setCreateQuestionDialog({
      open: true,
      testId: questionsDialog.testId,
      testName: questionsDialog.testName,
      title: '',
      questionText: '',
      answers: ['', '', '', ''],
      correctAnswerIndex: 0,
      loading: false,
      error: ''
    });
  };

  // Обработчик для редактирования вопроса
  const handleEditQuestionClick = (question) => {
    // Получаем данные вопроса из rawQuestion
    const rawQuestion = question.rawQuestion;
    
    setEditQuestionDialog({
      open: true,
      questionId: question.id,
      currentTitle: question.name,
      currentQuestionText: rawQuestion.question_text || rawQuestion.text || '',
      currentAnswers: rawQuestion.answers || ['', '', '', ''],
      currentCorrectAnswerIndex: rawQuestion.correct_answer || 0,
      currentVersion: question.version,
      title: question.name,
      questionText: rawQuestion.question_text || rawQuestion.text || '',
      answers: rawQuestion.answers || ['', '', '', ''],
      correctAnswerIndex: rawQuestion.correct_answer || 0,
      loading: false,
      error: ''
    });
  };

  // Обработчик для удаления вопроса
  const handleDeleteQuestionClick = (question) => {
    setDeleteQuestionDialog({
      open: true,
      questionId: question.id,
      questionTitle: question.name,
      loading: false,
      error: ''
    });
  };
  

  // ============= НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ДОБАВЛЕНИЯ ВОПРОСА В ТЕСТ =============

  // Обработчик для открытия диалога добавления вопроса в тест
  const handleAddQuestionToTestClick = () => {
    setAddQuestionToTestDialog({
      open: true,
      testId: questionsDialog.testId,
      testName: questionsDialog.testName,
      disciplineId: questionsDialog.disciplineId,
      disciplineName: questionsDialog.disciplineName,
      allQuestions: [],
      selectedQuestionId: '',
      loading: true,
      error: ''
    });

    // Состояние для редактирования вопроса
const [editQuestionDialog, setEditQuestionDialog] = useState({
  open: false,
  questionId: null,
  currentTitle: '',
  currentQuestionText: '',
  currentAnswers: ['', '', '', ''],
  currentCorrectAnswerIndex: 0,
  currentVersion: 1,
  title: '',
  questionText: '',
  answers: ['', '', '', ''],
  correctAnswerIndex: 0,
  loading: false,
  error: ''
});

const [deleteQuestionDialog, setDeleteQuestionDialog] = useState({
  open: false,
  questionId: null,
  questionTitle: '',
  loading: false,
  error: ''
});
// Состояние для просмотра пользователей, прошедших тест
const [testUsersDialog, setTestUsersDialog] = useState({
  open: false,
  testId: null,
  testName: '',
  disciplineId: null,
  disciplineName: '',
  users: [], // {id, name, attempts: [{id, started_at, completed_at, score}]}
  loading: false,
  error: ''
});

// Состояние для детального просмотра попытки пользователя
const [userAttemptDialog, setUserAttemptDialog] = useState({
  open: false,
  userId: null,
  userName: '',
  testId: null,
  testName: '',
  attempts: [], // Все попытки пользователя по этому тесту
  selectedAttempt: null, // Выбранная попытка для просмотра ответов
  answers: [], // Ответы пользователя в выбранной попытке
  loading: false,
  error: ''
});

// Состояние для фильтрации и поиска
const [searchTerm, setSearchTerm] = useState('');
    
    // Загружаем все доступные вопросы
    fetchAllQuestions();
  };



// Обработчик для начала теста
const handleStartTestClick = async (test, disciplineName = '', disciplineId = null) => {
  const actualDisciplineId = disciplineId || disciplineTestsDialog.disciplineId;
  
  if (!actualDisciplineId) {
    showSnackbar('Ошибка: не указан ID дисциплины', 'error');
    return;
  }
  
  setStartTestDialog({
    open: true,
    testId: test.id,
    testName: test.name || 'Без названия',
    disciplineName: disciplineName || test.discipline_name || '',
    disciplineId: actualDisciplineId,
    attemptId: null,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    loading: true,
    error: ''
  });
  
  try {
    // 1. Инициализируем тест - получаем attempt_id и вопросы
    // Передаем оба параметра: userId и testId
    const testData = await initializeTest(userId, test.id);
    
    // 2. Проверяем структуру данных
    if (!testData.attempt_id) {
      throw new Error('Не получен ID попытки теста');
    }
    
    // 3. Проверяем формат вопросов
    let formattedQuestions = [];
    
    if (testData.questions && Array.isArray(testData.questions)) {
      // Если вопросы пришли в нужном формате
      formattedQuestions = testData.questions.map((question, index) => ({
        ...question,
        position: question.position || index + 1
      }));
    } else {
      // Если вопросы пришли в другом формате, адаптируем их
      console.warn('Вопросы пришли в неожиданном формате, производим адаптацию:', testData);
      
      // Попробуем адаптировать разные форматы
      if (testData.questions) {
        formattedQuestions = Object.values(testData.questions).map((q, index) => ({
          id: q.id || index,
          title: q.title || `Вопрос ${index + 1}`,
          text: q.text || q.question_text || q.name || '',
          position: q.position || index + 1,
          options: (q.options || q.answers || []).map((opt, optIndex) => ({
            id: opt.id || optIndex,
            text: opt.text || opt.answer_text || opt || ''
          }))
        }));
      }
    }
    
    if (formattedQuestions.length === 0) {
      throw new Error('В тесте нет вопросов');
    }
    
    // 4. Обновляем состояние с полученными данными
    setStartTestDialog(prev => ({
      ...prev,
      attemptId: testData.attempt_id,
      questions: formattedQuestions,
      loading: false
    }));
    
  } catch (err) {
    console.error('Ошибка начала теста:', err);
    setStartTestDialog(prev => ({ 
      ...prev, 
      error: err.message,
      loading: false
    }));
    showSnackbar(`Ошибка начала теста: ${err.message}`, 'error');
  }
};

const fetchTestMarks = async (disciplineId, testId) => {
  const url = `${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/passers/marks`;

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};




const [testMarksDialog, setTestMarksDialog] = useState({
  open: false,
  disciplineId: null,
  disciplineName: "",
  testId: null,
  testName: "",
  marks: [],
  loading: false,
  error: null,
});

const handleViewTestMarksClick = async (test, discipline) => {
  setTestMarksDialog(prev => ({
    ...prev,
    open: true,
    disciplineId: discipline.id,
    disciplineName: discipline.name,
    testId: test.id,
    testName: test.name,
    marks: [],
    loading: true,
    error: null,
  }));

  try {
    const marks = await fetchTestMarks(discipline.id, test.id);
    setTestMarksDialog(prev => ({ ...prev, marks, loading: false }));
  } catch (err) {
    setTestMarksDialog(prev => ({ ...prev, error: err.message, loading: false }));
    showSnackbar(err.message, "error");
  }
};

const handleCloseTestMarksDialog = () => {
  setTestMarksDialog({
    open: false,
    disciplineId: null,
    disciplineName: "",
    testId: null,
    testName: "",
    marks: [],
    loading: false,
    error: null,
  });
};



// Обработчик для завершения теста
// Обработчик для завершения теста
// Обработчик для завершения теста
const handleSubmitTest = async () => {
  try {
    setStartTestDialog(prev => ({ ...prev, loading: true }));
    
    if (!startTestDialog.attemptId) {
      throw new Error('Не удалось определить ID попытки теста');
    }
    
    // Проверяем, все ли вопросы ответили
    const unansweredQuestions = startTestDialog.questions.filter((_, index) => 
      startTestDialog.userAnswers[index] === undefined
    );
    
    if (unansweredQuestions.length > 0) {
      const confirmResult = window.confirm(
        `У вас есть ${unansweredQuestions.length} неотвеченных вопросов. Все равно завершить тест?`
      );
      if (!confirmResult) {
        setStartTestDialog(prev => ({ ...prev, loading: false }));
        return;
      }
    }
    
    // Подготавливаем ответы для отправки
    const answers = Object.entries(startTestDialog.userAnswers).map(([questionIndex, answerIndex]) => {
      const question = startTestDialog.questions[questionIndex];
      const selectedOption = question.options[answerIndex];
      
      return {
        question_id: question.id,
        answer_option_id: selectedOption.id // Используем реальный ID варианта ответа
      };
    });
    
    // Отправляем ответы на сервер для завершения попытки
    const result = await completeTestAttempt(
      userId,
      startTestDialog.attemptId,
      answers
    );
    
    // Показываем результат
    showSnackbar(`Тест завершен! Ваш результат: ${result.score || 0} баллов`, 'success');
    
    // Открываем диалог с результатами
    setViewAttemptDialog({
      open: true,
      attemptId: startTestDialog.attemptId,
      userId: userId,
      userName: userName,
      testName: startTestDialog.testName,
      questions: startTestDialog.questions.map((q, index) => ({
        id: q.id,
        question_text: q.text || `Вопрос ${index + 1}`,
        user_answer: startTestDialog.userAnswers[index] !== undefined ? 
          `Ответ ${startTestDialog.userAnswers[index] + 1}` : 'Не отвечен',
        is_correct: true, // Нужно получать с сервера
        correct_answer: 'Правильный ответ' // Нужно получать с сервера
      })),
      userAnswers: startTestDialog.userAnswers,
      score: result.score || 0,
      status: 'completed',
      loading: false,
      error: ''
    });
    
    // Закрываем диалог начала теста
    handleCloseStartTestDialog();
    
  } catch (err) {
    console.error('Ошибка отправки теста:', err);
    setStartTestDialog(prev => ({ 
      ...prev, 
      error: err.message,
      loading: false
    }));
    showSnackbar(`Ошибка отправки теста: ${err.message}`, 'error');
  }
};
// Закрытие диалога начала теста
const handleCloseStartTestDialog = () => {
  setStartTestDialog({
    open: false,
    testId: null,
    testName: '',
    disciplineName: '',
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    loading: false,
    error: ''
  });
};

// Обработчик для выбора ответа
const handleAnswerSelect = (questionIndex, answerIndex) => {
  setStartTestDialog(prev => ({
    ...prev,
    userAnswers: {
      ...prev.userAnswers,
      [questionIndex]: answerIndex
    }
  }));
};


// Переход к следующему вопросу
const handleNextQuestion = () => {
  if (startTestDialog.currentQuestionIndex < startTestDialog.questions.length - 1) {
    setStartTestDialog(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1
    }));
  }
};

// Переход к предыдущему вопросу
const handlePreviousQuestion = () => {
  if (startTestDialog.currentQuestionIndex > 0) {
    setStartTestDialog(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex - 1
    }));
  }
};

  // Обработчик для добавления существующего вопроса в тест
  const handleSaveAddQuestionToTest = async () => {
    if (!addQuestionToTestDialog.selectedQuestionId) {
      showSnackbar('Выберите вопрос для добавления', 'warning');
      return;
    }
    
    try {
      await addQuestionToTest(
        addQuestionToTestDialog.testId,
        addQuestionToTestDialog.selectedQuestionId
      );
      handleCloseAddQuestionToTestDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчики меню вопросов
  const handleQuestionMenuOpen = (event, question) => {
    setQuestionMenuAnchor(event.currentTarget);
    setSelectedQuestionForMenu(question);
  };

  const handleQuestionMenuClose = () => {
    setQuestionMenuAnchor(null);
    setSelectedQuestionForMenu(null);
  };

  const handleQuestionMenuAction = (action) => {
    if (selectedQuestionForMenu) {
      switch (action) {
        case 'edit':
          handleEditQuestionClick(selectedQuestionForMenu);
          break;
        case 'delete':
          handleDeleteQuestionClick(selectedQuestionForMenu);
          break;
      }
    }
    handleQuestionMenuClose();
  };

  // Обработчик для сохранения нового вопроса
  const handleSaveCreateQuestion = async () => {
    if (!createQuestionDialog.title.trim()) {
      showSnackbar('Название вопроса не может быть пустым', 'warning');
      return;
    }
    
    if (!createQuestionDialog.questionText.trim()) {
      showSnackbar('Текст вопроса не может быть пустым', 'warning');
      return;
    }
    
    // Проверяем, что есть хотя бы 2 варианта ответа
    const nonEmptyAnswers = createQuestionDialog.answers.filter(answer => answer.trim() !== '');
    if (nonEmptyAnswers.length < 2) {
      showSnackbar('Необходимо указать хотя бы 2 варианта ответа', 'warning');
      return;
    }
    
    // Проверяем, что выбранный правильный ответ не пустой
    if (!createQuestionDialog.answers[createQuestionDialog.correctAnswerIndex]?.trim()) {
      showSnackbar('Правильный ответ не может быть пустым', 'warning');
      return;
    }
    
    try {
      await createQuestion(createQuestionDialog.testId, {
        title: createQuestionDialog.title.trim(),
        questionText: createQuestionDialog.questionText.trim(),
        answers: createQuestionDialog.answers,
        correctAnswerIndex: createQuestionDialog.correctAnswerIndex
      });
      handleCloseCreateQuestionDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчик для сохранения изменений вопроса
  const handleSaveEditQuestion = async () => {
    if (!editQuestionDialog.title.trim()) {
      showSnackbar('Название вопроса не может быть пустым', 'warning');
      return;
    }
    
    if (!editQuestionDialog.questionText.trim()) {
      showSnackbar('Текст вопроса не может быть пустым', 'warning');
      return;
    }
    
    // Проверяем, что есть хотя бы 2 варианта ответа
    const nonEmptyAnswers = editQuestionDialog.answers.filter(answer => answer.trim() !== '');
    if (nonEmptyAnswers.length < 2) {
      showSnackbar('Необходимо указать хотя бы 2 варианта ответа', 'warning');
      return;
    }
    
    // Проверяем, что выбранный правильный ответ не пустой
    if (!editQuestionDialog.answers[editQuestionDialog.correctAnswerIndex]?.trim()) {
      showSnackbar('Правильный ответ не может быть пустым', 'warning');
      return;
    }
    
    try {
      await updateQuestion(editQuestionDialog.questionId, {
        title: editQuestionDialog.title.trim(),
        questionText: editQuestionDialog.questionText.trim(),
        answers: editQuestionDialog.answers,
        correctAnswerIndex: editQuestionDialog.correctAnswerIndex,
        currentVersion: editQuestionDialog.currentVersion
      });
      handleCloseEditQuestionDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчик для подтверждения удаления вопроса
  const handleConfirmDeleteQuestion = async () => {
    try {
      await deleteQuestion(deleteQuestionDialog.questionId);
      handleCloseDeleteQuestionDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчики для мягкого удаления дисциплины
  const handleDeleteDisciplineClick = (discipline) => {
    setDeleteDisciplineDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      loading: false,
      error: ''
    });
  };

  const handleRestoreDisciplineClick = (discipline) => {
    setRestoreDisciplineDialog({
      open: true,
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      loading: false,
      error: ''
    });
  };

  const handleConfirmDeleteDiscipline = async () => {
    try {
      await deleteDiscipline(deleteDisciplineDialog.disciplineId);
      handleCloseDeleteDisciplineDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  const handleConfirmRestoreDiscipline = async () => {
    try {
      await restoreDiscipline(restoreDisciplineDialog.disciplineId);
      handleCloseRestoreDisciplineDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Обработчики меню теста
  const handleTestMenuOpen = (event, discipline, test) => {
    setTestMenuAnchor(event.currentTarget);
    setSelectedTestForMenu(test);
    setSelectedDisciplineForMenu(discipline);
  };

  const handleTestMenuClose = () => {
    setTestMenuAnchor(null);
    setSelectedTestForMenu(null);
    setSelectedDisciplineForMenu(null);
  };

  // Обработчики меню дисциплины
  const handleDisciplineMenuOpen = (event, discipline) => {
    setDisciplineMenuAnchor(event.currentTarget);
    setSelectedDisciplineForAction(discipline);
  };

  const handleDisciplineMenuClose = () => {
    setDisciplineMenuAnchor(null);
    setSelectedDisciplineForAction(null);
  };

  const handleDisciplineMenuAction = (action) => {
    if (selectedDisciplineForAction) {
      switch (action) {
        case 'view':
          handleViewDisciplineClick(selectedDisciplineForAction);
          break;
        case 'tests':
          handleViewDisciplineTests(selectedDisciplineForAction);
          break;
        case 'students':
          handleViewDisciplineStudents(selectedDisciplineForAction);
          break;
        case 'delete':
          if (selectedDisciplineForAction.deleted) {
            handleRestoreDisciplineClick(selectedDisciplineForAction);
          } else {
            handleDeleteDisciplineClick(selectedDisciplineForAction);
          }
          break;
      }
    }
    handleDisciplineMenuClose();
  };

  const handleTestMenuAction = (action) => {
    if (selectedDisciplineForMenu && selectedTestForMenu) {
      switch (action) {
        case 'check':
          handleCheckTestState(selectedDisciplineForMenu, selectedTestForMenu);
          break;
        case 'activate':
          handleActivateTestClick(selectedDisciplineForMenu, selectedTestForMenu);
          break;
        case 'delete':
          handleDeleteTestClick(selectedDisciplineForMenu, selectedTestForMenu);
          break;
      }
    }
    handleTestMenuClose();
  };

  const handleSaveDiscipline = async () => {
    const { mode, data } = disciplineDialog;
    
    if (mode === 'create') {
      if (!data.name.trim()) {
        showSnackbar('Название дисциплины не может быть пустым', 'warning');
        return;
      }
      
      try {
        await createDiscipline({
          name: data.name.trim(),
          description: data.description?.trim() || '',
          teacher_id: data.teacher_id || null
        });
        handleCloseDisciplineDialog();
      } catch (err) {
        // Ошибка уже обработана
      }
      
    } else if (mode === 'edit') {
      if (!data.name.trim()) {
        showSnackbar('Название дисциплины не может быть пустым', 'warning');
        return;
      }
      
      try {
        await updateDisciplineInfo(data.id, {
          name: data.name.trim(),
          description: data.description?.trim() || ''
        });
      } catch (err) {
        // Ошибка уже обработана
      }
    }
  };

  // Сохранение активации/деактивации теста
  const handleSaveTestActivation = async () => {
    try {
      await updateTestState(
        activateTestDialog.disciplineId,
        activateTestDialog.testId,
        activateTestDialog.newActive
      );
      handleCloseActivateTestDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Сохранение добавления теста
  const handleSaveTestAddition = async () => {
    if (!addTestDialog.testName.trim()) {
      showSnackbar('Название теста не может быть пустым', 'warning');
      return;
    }
    
    try {
      await addTestToDiscipline(addTestDialog.disciplineId, {
        name: addTestDialog.testName.trim(),
        description: addTestDialog.description?.trim() || ''
      });
      handleCloseAddTestDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Подтверждение удаления теста
  const handleConfirmTestDeletion = async () => {
    try {
      await deleteTestFromDiscipline(
        deleteTestDialog.disciplineId,
        deleteTestDialog.testId
      );
      handleCloseDeleteTestDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  // Закрытие диалога вопросов
  const handleCloseQuestionsDialog = () => {
    setQuestionsDialog({
      open: false,
      testId: null,
      testName: '',
      disciplineName: '',
      questions: [],
      loading: false,
      error: ''
    });
  };

  // ============= НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ЗАКРЫТИЯ ДИАЛОГОВ ВОПРОСОВ =============

  // Закрытие диалога создания вопроса
  const handleCloseCreateQuestionDialog = () => {
    setCreateQuestionDialog({
      open: false,
      testId: null,
      testName: '',
      title: '',
      questionText: '',
      answers: ['', '', '', ''],
      correctAnswerIndex: 0,
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога редактирования вопроса
  const handleCloseEditQuestionDialog = () => {
    setEditQuestionDialog({
      open: false,
      questionId: null,
      currentTitle: '',
      currentQuestionText: '',
      currentAnswers: ['', '', '', ''],
      currentCorrectAnswerIndex: 0,
      currentVersion: 1,
      title: '',
      questionText: '',
      answers: ['', '', '', ''],
      correctAnswerIndex: 0,
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога удаления вопроса
  const handleCloseDeleteQuestionDialog = () => {
    setDeleteQuestionDialog({
      open: false,
      questionId: null,
      questionTitle: '',
      loading: false,
      error: ''
    });
  };

  // ============= НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ЗАКРЫТИЯ ДИАЛОГА ДОБАВЛЕНИЯ ВОПРОСА В ТЕСТ =============

  // Закрытие диалога добавления вопроса в тест
  const handleCloseAddQuestionToTestDialog = () => {
    setAddQuestionToTestDialog({
      open: false,
      testId: null,
      testName: '',
      disciplineId: null,
      disciplineName: '',
      allQuestions: [],
      selectedQuestionId: '',
      loading: false,
      error: ''
    });
  };

  // Обработчики для пользователей
  const handleViewUserClick = (userId) => {
    setSelectedUserId(userId);
    setOpenUserDialog(true);
    setSelectedUserInfo(null);
    setUserInfoError('');
    
    fetchUserById(userId);
  };

  const handleEditUserClick = (user) => {
    setEditUserData({
      id: user.id,
      currentName: user.full_name || user.name || '',
      newName: user.full_name || user.name || '',
    });
    setOpenEditDialog(true);
  };

  const handleEditRolesClick = (user) => {
    setEditRolesData({
      id: user.id,
      currentRoles: user.roles || [],
      newRoles: user.roles || [],
    });
    setOpenRolesDialog(true);
  };

  const handleBlockUserClick = (user) => {
    const isBlocked = blockStatuses[user.id] || false;
    setBlockUserData({
      id: user.id,
      name: user.full_name || user.name || 'Пользователь',
      currentBlocked: isBlocked,
      newBlocked: !isBlocked,
      reason: '',
    });
    setOpenBlockDialog(true);
  };

  // Обработчики из диалога просмотра
  const handleEditRolesFromDialog = () => {
    if (selectedUserInfo) {
      setEditRolesData({
        id: selectedUserInfo.id,
        currentRoles: selectedUserInfo.roles || [],
        newRoles: selectedUserInfo.roles || [],
      });
      setOpenUserDialog(false);
      setOpenRolesDialog(true);
    }
  };

  const handleBlockFromDialog = () => {
    if (selectedUserInfo) {
      const isBlocked = selectedUserInfo.blocked || false;
      setBlockUserData({
        id: selectedUserInfo.id,
        name: selectedUserInfo.full_name || selectedUserInfo.name || 'Пользователь',
        currentBlocked: isBlocked,
        newBlocked: !isBlocked,
        reason: '',
      });
      setOpenUserDialog(false);
      setOpenBlockDialog(true);
    }
  };

  const handleEditFromDialog = () => {
    if (selectedUserInfo) {
      setEditUserData({
        id: selectedUserInfo.id,
        currentName: selectedUserInfo.full_name || selectedUserInfo.name || '',
        newName: selectedUserInfo.full_name || selectedUserInfo.name || '',
      });
      setOpenUserDialog(false);
      setOpenEditDialog(true);
    }
  };

  // Закрытие диалогов
  const handleCloseDisciplineDialog = () => {
    setDisciplineDialog({
      open: false,
      mode: 'view',
      data: null,
      loading: false,
      error: ''
    });
    setDisciplineDetail(null);
  };

  const handleCloseTestsDialog = () => {
    setDisciplineTestsDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      tests: [],
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога студентов дисциплины
  const handleCloseStudentsDialog = () => {
    setDisciplineStudentsDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      students: [],
      allStudents: [],
      loading: false,
      error: '',
      searchTerm: '',
      addStudentDialog: {
        open: false,
        studentId: '',
        loading: false,
        error: ''
      }
    });
  };

  // Закрытие диалога проверки активности теста
  const handleCloseTestStateDialog = () => {
    setTestStateDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      testId: null,
      testName: '',
      isActive: false,
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога активации теста
  const handleCloseActivateTestDialog = () => {
    setActivateTestDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      testId: null,
      testName: '',
      currentActive: false,
      newActive: false,
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога добавления теста
  const handleCloseAddTestDialog = () => {
    setAddTestDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      testName: '',
      description: '',
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога удаления теста
  const handleCloseDeleteTestDialog = () => {
    setDeleteTestDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      testId: null,
      testName: '',
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога удаления дисциплины
  const handleCloseDeleteDisciplineDialog = () => {
    setDeleteDisciplineDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      loading: false,
      error: ''
    });
  };

  // Закрытие диалога восстановления дисциплина
  const handleCloseRestoreDisciplineDialog = () => {
    setRestoreDisciplineDialog({
      open: false,
      disciplineId: null,
      disciplineName: '',
      loading: false,
      error: ''
    });
  };

  const handleCloseViewDialog = () => {
    setOpenUserDialog(false);
    setSelectedUserId('');
    setSelectedUserInfo(null);
    setUserInfoError('');
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditUserData({
      id: '',
      currentName: '',
      newName: '',
    });
  };

  const handleCloseRolesDialog = () => {
    setOpenRolesDialog(false);
    setEditRolesData({
      id: '',
      currentRoles: [],
      newRoles: [],
    });
  };

  const handleCloseBlockDialog = () => {
    setOpenBlockDialog(false);
    setBlockUserData({
      id: '',
      name: '',
      currentBlocked: false,
      newBlocked: false,
      reason: '',
    });
  };

  // Сохранение данных
  const handleSaveName = async () => {
    if (!editUserData.newName.trim()) {
      showSnackbar('ФИО не может быть пустым', 'warning');
      return;
    }
    
    if (editUserData.newName === editUserData.currentName) {
      showSnackbar('ФИО не изменилось', 'info');
      handleCloseEditDialog();
      return;
    }
    
    try {
      await updateUserName(editUserData.id, editUserData.newName);
      handleCloseEditDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  const handleSaveRoles = async () => {
    if (JSON.stringify(editRolesData.newRoles.sort()) === JSON.stringify(editRolesData.currentRoles.sort())) {
      showSnackbar('Роли не изменились', 'info');
      handleCloseRolesDialog();
      return;
    }
    
try {
    await updateUserRoles(editRolesData.id, editRolesData.newRoles);
    if (editRolesData.id === userId) {  // userId === 1
      await fetchUserProfile();  // Перезагружает роли
    }
    handleCloseRolesDialog();
  } catch (err) { /* ... */ }
};

  const handleConfirmBlock = async () => {
    try {
      await updateUserBlockStatus(blockUserData.id, blockUserData.newBlocked, blockUserData.reason);
      handleCloseBlockDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
  };

  const handleRoleChange = (roleValue) => {
    setEditRolesData(prev => {
      const newRoles = prev.newRoles.includes(roleValue)
        ? prev.newRoles.filter(r => r !== roleValue)
        : [...prev.newRoles, roleValue];
      
      return {
        ...prev,
        newRoles
      };
    });
  };

  // ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

  const getTestStatus = (test) => {
    if (test.state === 'active') return 'Активен';
    if (test.state === 'inactive') return 'Неактивен';
    if (test.state === 'draft') return 'Черновик';
    return test.state || 'Неизвестно';
  };

  const getTestStatusColor = (test) => {
    if (test.state === 'active') return 'success';
    if (test.state === 'inactive') return 'error';
    if (test.state === 'draft') return 'warning';
    return 'default';
  };

  const getRoleChipColor = (role) => {
    const roleObj = AVAILABLE_ROLES.find(r => r.value === role.toLowerCase());
    return roleObj ? roleObj.color : 'secondary';
  };

  const getRoleIcon = (role) => {
    const roleObj = AVAILABLE_ROLES.find(r => r.value === role.toLowerCase());
    return roleObj ? roleObj.icon : <BadgeIcon />;
  };

  const getBlockStatus = (userId) => {
    return blockStatuses[userId] || false;
  };

const getBlockStatusComponent = (userId) => {
  const isBlocked = getBlockStatus(userId);

  if (isBlocked) {
    return (
      <Tooltip title="Пользователь заблокирован">
        <Chip
          icon={<BlockIcon />}
          label="Заблокирован"
          color="error"
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Пользователь активен">
      <Chip
        icon={<CheckCircleIcon />}
        label="Активен"
        color="success"
        size="small"
        variant="outlined"
      />
    </Tooltip>
  );
};



  // Проверка прав пользователя
  const hasPermission = (permission) => {
    // Здесь должна быть логика проверки прав пользователя
    // Для демонстрации считаем, что у пользователя есть все права
    return true;
  };

  // Фильтрация студентов по поисковому запросу
  const getFilteredStudents = () => {
    const { searchTerm, students } = disciplineStudentsDialog;
    
    if (!searchTerm.trim()) {
      return students;
    }
    
    const term = searchTerm.toLowerCase();
    return students.filter(student =>
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.id.toString().includes(term)
    );
  };

  // Получение списка дисциплин с учетом фильтра
  const getFilteredDisciplines = () => {
    if (showDeleted) {
      // Показываем все дисциплины, включая удаленные
      return disciplines;
    } else {
      // Показываем только активные дисциплины
      return disciplines.filter(d => !d.deleted);
    }
  };

  // Подсчет количества активных и удаленных дисциплин
  const getDisciplineStats = () => {
    const active = disciplines.filter(d => !d.deleted).length;
    const deleted = disciplines.filter(d => d.deleted).length;
    return { active, deleted };
  };

  // Загрузка данных при переключении вкладок
  useEffect(() => {
    if (activeTab === 'Участники') {
      fetchUsers();
    } else if (activeTab === 'Дисциплина') {
      fetchDisciplines();
    } else if (activeTab === 'Тест') {
      fetchDisciplines();
    }
  }, [activeTab]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Typography variant="h6" sx={{ p: 2, color: 'text.primary' }}>
            Личный кабинет
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  selected={activeTab === item.text}
                  onClick={() => setActiveTab(item.text)}
                  sx={{ 
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }
                  }}
                >
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, minHeight: '100vh' }}>
          
          {/* ВКЛАДКА ПРОФИЛЬ */}
          {activeTab === 'Профиль' && (
            <Paper sx={{ p: 3, maxWidth: 800 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Профиль пользователя</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getBlockStatusComponent(userId)}
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditUserClick({
                      id: userId,
                      full_name: userName,
                    })}
                  >
                    Редактировать ФИО
                  </Button>
                  <Button
    variant="outlined"
    color="error"
    onClick={() => (window.location.href = "/logout")}
  >
    Выход
  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />

              {profileLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 1 }}>Загрузка профиля...</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                  <Typography>Ошибка: {error}</Typography>
                  <Button 
                    size="small" 
                    onClick={() => window.location.reload()} 
                    sx={{ mt: 1 }}
                  >
                    Попробовать снова
                  </Button>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Avatar sx={{ mr: 2, width: 56, height: 56, bgcolor: 'primary.main' }}>
                      {userName.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>{userName}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" /> {userEmail}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        ID: {userId}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mt: 3, mb: 2 }} />
                  
                  <Typography variant="h6" sx={{ mb: 2 }}>Дополнительная информация</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Здесь будет отображаться дополнительная информация о пользователе...
                  </Typography>
                </>
              )}
            </Paper>
          )}

          {/* ВКЛАДКА ДИСЦИПЛИНА */}
          {activeTab === 'Дисциплина' && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Список дисциплин</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={fetchDisciplines}
                    disabled={disciplinesLoading}
                    startIcon={disciplinesLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  >
                    Обновить
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateDisciplineClick}
                  >
                    Создать дисциплину
                  </Button>
                </Box>
              </Box>
              {disciplinesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Загрузка дисциплин...</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                  <Typography>Ошибка: {error}</Typography>
                  <Button size="small" onClick={fetchDisciplines} sx={{ mt: 1 }}>
                    Попробовать снова
                  </Button>
                </Box>
              ) 
              : getFilteredDisciplines().length > 0 ? (
                <Grid container spacing={3}>
                  {getFilteredDisciplines().map((discipline) => (
                    <Grid item size={{ xs: 12, md: 6, lg: 4 }} key={discipline.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          opacity: discipline.deleted ? 0.7 : 1,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: discipline.deleted ? 2 : 6,
                          }
                        }}
                      >
                        <CardHeader
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                              }}>
                                {discipline.name}
                              </Typography>
                              {discipline.deleted && (
                                <Tooltip title="Дисциплина удалена">
                                  <Chip
                                    label="Удалена"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          }
                          subheader={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <NumbersIcon fontSize="small" />
                              <Typography variant="body2">ID: {discipline.id}</Typography>
                            </Box>
                          }
                          avatar={
                            <Avatar sx={{ 
                              bgcolor: discipline.deleted ? 'error.main' : 'primary.main' 
                            }}>
                              {discipline.deleted ? <ArchiveIcon /> : <SchoolIcon />}
                            </Avatar>
                          }
                          action={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Tooltip title="Дополнительные действия">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => handleDisciplineMenuOpen(e, discipline)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                          sx={{ pb: 1 }}
                        />
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                height: '4.5em'
                              }}
                            >
                              {discipline.description || 'Описание отсутствует'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 'auto' }}>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={discipline.deleted ? <UnarchiveIcon /> : <InfoIcon />}
                                onClick={() => {
                                  if (discipline.deleted) {
                                    handleRestoreDisciplineClick(discipline);
                                  } else {
                                    handleViewDisciplineClick(discipline);
                                  }
                                }}
                                fullWidth
                                color={discipline.deleted ? "success" : "primary"}
                              >
                                {discipline.deleted ? 'Восстановить' : 'Информация'}
                              </Button>
                              {!discipline.deleted && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<QuizIcon />}
                                    onClick={() => handleViewDisciplineTests(discipline)}
                                    sx={{ flex: 1 }}
                                  >
                                    Тесты
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PeopleIcon />}
                                    onClick={() => handleViewDisciplineStudents(discipline)}
                                    sx={{ flex: 1 }}
                                  >
                                    Студенты
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  color: 'text.secondary',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}>
                  <SchoolIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {showDeleted ? 'Удаленные дисциплины не найдены' : 'Дисциплины не найдены'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    {showDeleted 
                      ? 'В архиве пока нет удаленных дисциплин'
                      : 'В системе пока нет зарегистрированных дисциплин'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateDisciplineClick}
                    sx={{ mr: 2 }}
                  >
                    Создать первую дисциплину
                  </Button>
                  {showDeleted ? (
                    <Button 
                      variant="outlined"
                      onClick={() => setShowDeleted(false)}
                    >
                      Показать активные
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined"
                      onClick={fetchDisciplines}
                    >
                      Обновить список
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          )}

          {/* ВКЛАДКА ТЕСТ */}
          {activeTab === 'Тест' && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Управление тестами и вопросами</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={fetchDisciplines}
                    disabled={disciplinesLoading}
                    startIcon={disciplinesLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  >
                    Обновить
                  </Button>
                </Box>
              </Box>
              
              {disciplinesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Загрузка дисциплин...</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                  <Typography>Ошибка: {error}</Typography>
                  <Button size="small" onClick={fetchDisciplines} sx={{ mt: 1 }}>
                    Попробовать снова
                  </Button>
                </Box>
              ) : disciplines.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {disciplines.map((discipline) => (
                    <Accordion key={discipline.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <SchoolIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">{discipline.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {discipline.id} • {discipline.description || 'Без описания'}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<QuizIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDisciplineTests(discipline);
                            }}
                          >
                            Тесты дисциплины
                          </Button>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ pl: 7, pr: 2 }}>
                          {disciplineTestsDialog.loading && disciplineTestsDialog.disciplineId === discipline.id ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={24} />
                              <Typography sx={{ ml: 2 }}>Загрузка тестов...</Typography>
                            </Box>
                          ) : disciplineTestsDialog.tests.length > 0 && disciplineTestsDialog.disciplineId === discipline.id ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Тесты дисциплины "{discipline.name}":
                              </Typography>
                              <Grid container spacing={2}>
                                {disciplineTestsDialog.tests.map((test) => (
                                  <Grid item xs={12} md={6} lg={4} key={test.id}>
                                    <Card sx={{ height: '100%' }}>
                                      <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                          <Box>
                                            <Typography variant="h6">{test.name || 'Без названия'}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              ID: {test.id}
                                            </Typography>
                                          </Box>
                                          <Chip
                                            label={getTestStatus(test)}
                                            color={getTestStatusColor(test)}
                                            size="small"
                                            variant="outlined"
                                          />
                                        </Box>
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                          {test.description || 'Описание отсутствует'}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<QuestionAnswerIcon />}
                                            onClick={() => handleViewTestQuestions(
                                              test, 
                                              discipline.name,
                                              discipline.id
                                            )}
                                          >
                                            Вопросы теста
                                          </Button>
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => handleCheckTestState(discipline, test)}
                                          >
                                            Проверить активность
                                          </Button>
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={test.state === 'active' ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
                                            onClick={() => handleActivateTestClick(discipline, test)}
                                          >
                                            {test.state === 'active' ? 'Деактивировать' : 'Активировать'}
                                          </Button>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                              <QuizIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                              <Typography variant="h6" sx={{ mb: 1 }}>
                                Тесты не загружены
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 3 }}>
                                Нажмите кнопку "Тесты дисциплины" для загрузки тестов
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<QuizIcon />}
                                onClick={() => handleViewDisciplineTests(discipline)}
                              >
                                Загрузить тесты
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  color: 'text.secondary',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}>
                  <SchoolIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Дисциплины не найдены
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    В системе пока нет зарегистрированных дисциплин
                  </Typography>
                  <Button 
                    variant="outlined"
                    onClick={fetchDisciplines}
                  >
                    Обновить список
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {/* ВКЛАДКА УЧАСТНИКИ */}
          {activeTab === 'Участники' && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Участники</Typography>
                <Button 
                  variant="contained" 
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  startIcon={usersLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {usersLoading ? 'Загрузка...' : 'Обновить список'}
                </Button>
              </Box>

              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Загрузка пользователей...</Typography>
                </Box>
              ) : error ? (
                <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                  <Typography>Ошибка: {error}</Typography>
                  <Button size="small" onClick={fetchUsers} sx={{ mt: 1 }}>
                    Попробовать снова
                  </Button>
                </Box>
              ) : users.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>ФИО</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => {
                        const isBlocked = blockStatuses[user.id] || false;
                        return (
                          <TableRow 
                            key={user.id} 
                            hover
                            sx={{
                              backgroundColor: isBlocked ? 'rgba(244, 67, 54, 0.08)' : 'inherit',
                              '&:hover': {
                                backgroundColor: isBlocked ? 'rgba(244, 67, 54, 0.12)' : 'rgba(255, 255, 255, 0.08)'
                              }
                            }}
                          >
                            <TableCell>{user.id}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {user.full_name || user.name || '—'}
                                {isBlocked && (
                                  <Tooltip title="Пользователь заблокирован">
                                    <BlockIcon color="error" fontSize="small" />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {getBlockStatusComponent(user.id)}
                            </TableCell>
                        
                            <TableCell>
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<InfoIcon />}
                                  onClick={() => handleViewUserClick(user.id)}
                                >
                                  Посмотреть
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="secondary"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleEditUserClick(user)}
                                >
                                  ФИО
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  startIcon={<SecurityIcon />}
                                  onClick={() => handleEditRolesClick(user)}
                                >
                                  Роли
                                </Button>
                                <Tooltip 
                                  title={isBlocked ? "Разблокировать пользователя" : "Заблокировать пользователя"}
                                >
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color={isBlocked ? "success" : "error"}
                                    startIcon={isBlocked ? <LockOpenIcon /> : <LockIcon />}
                                    onClick={() => handleBlockUserClick(user)}
                                  >
                                    {isBlocked ? "Разблокировать" : "Заблокировать"}
                                  </Button>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Участники не найдены</Typography>
                  <Button onClick={fetchUsers} variant="outlined">
                    Загрузить
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {/* ВКЛАДКА ПРЕПОДАВАТЕЛЬ */}
          {activeTab === 'Преподаватель' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Преподаватели</Typography>
              <Typography variant="body1">
                Функционал преподавателей будет реализован позже...
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* ДИАЛОГ ПРОСМОТРА ИНФОРМАЦИИ О ДИСЦИПЛИНЕ */}
      <Dialog 
        open={disciplineDialog.open} 
        onClose={handleCloseDisciplineDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {disciplineDialog.mode === 'create' ? 'Создание дисциплины' : 
                   disciplineDialog.mode === 'edit' ? 'Редактирование дисциплины' : 
                   disciplineDialog.data?.name || 'Дисциплина'}
                </Typography>
                {disciplineDialog.mode === 'view' && disciplineDialog.data?.id && (
                  <Typography variant="body2" color="textSecondary">
                    ID: {disciplineDialog.data.id}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={handleCloseDisciplineDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {disciplineDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка...</Typography>
            </Box>
          ) : disciplineDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {disciplineDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {disciplineDialog.mode === 'view' && disciplineDialog.data ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Основная информация
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>ID дисциплины:</strong> {disciplineDialog.data.id}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Название:</strong> {disciplineDialog.data.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>ID преподавателя:</strong> {disciplineDetail?.teacher_id || 'Не указан'}
                          </Typography>
                          {disciplineDialog.data.created_at && (
                            <Typography variant="body1">
                              <strong>Дата создания:</strong> {new Date(disciplineDialog.data.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Описание дисциплины
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        minHeight: '100px'
                      }}>
                        <Typography variant="body1">
                          {disciplineDialog.data.description || 'Описание отсутствует'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<QuizIcon />}
                        onClick={() => {
                          handleCloseDisciplineDialog();
                          handleViewDisciplineTests(disciplineDialog.data);
                        }}
                        sx={{ flex: 1 }}
                      >
                        Просмотреть тесты
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<PeopleIcon />}
                        onClick={() => {
                          handleCloseDisciplineDialog();
                          handleViewDisciplineStudents(disciplineDialog.data);
                        }}
                        sx={{ flex: 1 }}
                      >
                        Просмотреть студентов
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Название дисциплины *
                    </Typography>
                    <TextField
                      value={disciplineDialog.data?.name || ''}
                      onChange={(e) => setDisciplineDialog(prev => ({
                        ...prev,
                        data: { ...prev.data, name: e.target.value }
                      }))}
                      fullWidth
                      placeholder="Введите название дисциплины"
                      size="small"
                      autoFocus
                      error={!disciplineDialog.data?.name?.trim()}
                      helperText={!disciplineDialog.data?.name?.trim() ? "Название не может быть пустым" : ""}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Описание дисциплины
                    </Typography>
                    <TextField
                      value={disciplineDialog.data?.description || ''}
                      onChange={(e) => setDisciplineDialog(prev => ({
                        ...prev,
                        data: { ...prev.data, description: e.target.value }
                      }))}
                      fullWidth
                      placeholder="Введите описание дисциплины"
                      size="small"
                      multiline
                      rows={4}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {disciplineDialog.mode === 'view' ? (
            <>
              {!disciplineDialog.data?.deleted && (
                <Button 
                  startIcon={<EditIcon />}
                  onClick={() => setDisciplineDialog(prev => ({
                    ...prev,
                    mode: 'edit'
                  }))}
                  variant="outlined"
                >
                  Редактировать
                </Button>
              )}
              <Button onClick={handleCloseDisciplineDialog}>Закрыть</Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCloseDisciplineDialog}
                startIcon={<CancelIcon />}
                disabled={disciplineDialog.loading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSaveDiscipline}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={disciplineDialog.loading || !disciplineDialog.data?.name?.trim()}
              >
                {disciplineDialog.loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {disciplineDialog.mode === 'create' ? 'Создание...' : 'Сохранение...'}
                  </>
                ) : (
                  disciplineDialog.mode === 'create' ? 'Создать' : 'Сохранить'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ СТУДЕНТОВ ДИСЦИПЛИНЫ */}
      <Dialog 
        open={disciplineStudentsDialog.open} 
        onClose={handleCloseStudentsDialog} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Студенты дисциплины: {disciplineStudentsDialog.disciplineName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID дисциплины: {disciplineStudentsDialog.disciplineId}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Добавить студента">
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenAddStudentDialog}
                >
                  Добавить студента
                </Button>
              </Tooltip>
              <IconButton onClick={handleCloseStudentsDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {disciplineStudentsDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка студентов...</Typography>
            </Box>
          ) : disciplineStudentsDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {disciplineStudentsDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Поиск студентов */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Поиск студентов
                </Typography>
                <TextField
                  value={disciplineStudentsDialog.searchTerm}
                  onChange={(e) => setDisciplineStudentsDialog(prev => ({
                    ...prev,
                    searchTerm: e.target.value
                  }))}
                  fullWidth
                  placeholder="Поиск по имени, email или ID..."
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
              
              {/* Список студентов */}
              {getFilteredStudents().length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID студента</TableCell>
                        <TableCell>ФИО</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredStudents().map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>{student.id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Просмотреть профиль">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<InfoIcon />}
                                  onClick={() => {
                                    handleCloseStudentsDialog();
                                    handleViewUserClick(student.id);
                                  }}
                                >
                                  Профиль
                                </Button>
                              </Tooltip>
                              <Tooltip title="Отчислить с дисциплины">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  startIcon={<PersonRemoveIcon />}
                                  onClick={() => handleRemoveStudentFromDiscipline(student.id)}
                                >
                                  Отчислить
                                </Button>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8, 
                  color: 'text.secondary',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}>
                  <PeopleIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {disciplineStudentsDialog.searchTerm ? 
                      'Студенты не найдены' : 
                      'На этой дисциплине пока нет студентов'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    {disciplineStudentsDialog.searchTerm ? 
                      'Попробуйте изменить условия поиска' : 
                      'Запишите первого студента на дисциплину'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenAddStudentDialog}
                  >
                    Добавить студента
                  </Button>
                </Box>
              )}
              
              {/* Статистика */}
              {getFilteredStudents().length > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'info.main', 
                  color: 'white', 
                  borderRadius: 1 
                }}>
                  <Typography variant="body2">
                    Всего студентов: {disciplineStudentsDialog.students.length}
                    {disciplineStudentsDialog.searchTerm && 
                      ` (Найдено: ${getFilteredStudents().length})`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentsDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ДОБАВЛЕНИЯ СТУДЕНТА НА ДИСЦИПЛИНУ */}
      <Dialog 
        open={disciplineStudentsDialog.addStudentDialog.open} 
        onClose={handleCloseAddStudentDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <PersonAddIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Запись студента на дисциплину
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {disciplineStudentsDialog.disciplineName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseAddStudentDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {disciplineStudentsDialog.addStudentDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Запись студента...</Typography>
            </Box>
          ) : disciplineStudentsDialog.addStudentDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {disciplineStudentsDialog.addStudentDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о дисциплине
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {disciplineStudentsDialog.disciplineName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>ID дисциплины:</strong> {disciplineStudentsDialog.disciplineId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Выберите студента для записи
                </Typography>
                
                {/* Фильтрация студентов, которые еще не записаны на дисциплину */}
                {disciplineStudentsDialog.allStudents.length > 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel id="student-select-label">Выберите студента</InputLabel>
                    <Select
                      labelId="student-select-label"
                      value={disciplineStudentsDialog.addStudentDialog.studentId}
                      label="Выберите студента"
                      onChange={(e) => setDisciplineStudentsDialog(prev => ({
                        ...prev,
                        addStudentDialog: {
                          ...prev.addStudentDialog,
                          studentId: e.target.value
                        }
                      }))}
                    >
                      {disciplineStudentsDialog.allStudents
                        .filter(student => 
                          !disciplineStudentsDialog.students.some(s => s.id === student.id)
                        )
                        .map((student) => (
                          <MenuItem key={student.id} value={student.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body1">{student.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {student.id} • Email: {student.email}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1">
                      Нет доступных студентов для записи
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  • Студент сможет проходить тесты по этой дисциплине<br />
                  • Для студентов можно просматривать статистику прохождения<br />
                  • Отчислить студента можно в любой момент
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
<DialogActions>
  <Button onClick={handleCloseAddStudentDialog} disabled={disciplineStudentsDialog.addStudentDialog.loading}>
    Отмена
  </Button>
  <Button
    onClick={handleAddStudentToDiscipline}
    variant="contained"
    color="success"
    disabled={
      disciplineStudentsDialog.addStudentDialog.loading ||
      !disciplineStudentsDialog.addStudentDialog.studentId
    }
    startIcon={<PersonAddIcon />}
  >
    {disciplineStudentsDialog.addStudentDialog.loading ? (
      <CircularProgress size={20} />
    ) : (
      'Записать'
    )}
  </Button>
</DialogActions>
      </Dialog>

      {/* ДИАЛОГ ТЕСТОВ ДИСЦИПЛИНЫ */}
      <Dialog 
        open={disciplineTestsDialog.open} 
        onClose={handleCloseTestsDialog} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <QuizIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Тесты дисциплины: {disciplineTestsDialog.disciplineName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID дисциплины: {disciplineTestsDialog.disciplineId}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Добавить тест">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddTestClick({
                    id: disciplineTestsDialog.disciplineId,
                    name: disciplineTestsDialog.disciplineName
                  })}
                >
                  Добавить тест
                </Button>
              </Tooltip>
              <IconButton onClick={handleCloseTestsDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {disciplineTestsDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка тестов...</Typography>
            </Box>
          ) : disciplineTestsDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {disciplineTestsDialog.error}</Typography>
            </Box>
          ) : disciplineTestsDialog.tests.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID теста</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Дата создания</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disciplineTestsDialog.tests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>{test.id}</TableCell>
                      <TableCell>{test.name || 'Без названия'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {test.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTestStatus(test)}
                          color={getTestStatusColor(test)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {test.created_at ? 
                          new Date(test.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title="Посмотреть вопросы">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<QuestionAnswerIcon />}
                              onClick={() => handleViewTestQuestions(test, disciplineTestsDialog.disciplineName)}
                            >
                              Вопросы
                            </Button>
                          </Tooltip>
                          <Tooltip title="Проверить активность">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleCheckTestState(
                                { 
                                  id: disciplineTestsDialog.disciplineId, 
                                  name: disciplineTestsDialog.disciplineName 
                                }, 
                                test
                              )}
                            >
                              Проверить
                            </Button>
                          </Tooltip>
<Tooltip title="Начать тест">
  <Button
    variant="contained"
    color="success"
    startIcon={<PlayCircleOutlineIcon />}
    onClick={() => {
      // Используем текущий тест из цикла map
      const testObj = {
        id: test.id, // <-- Используем id текущего теста
        name: test.name,
        discipline_name: disciplineTestsDialog.disciplineName
      };
      handleStartTestClick(
        testObj, 
        disciplineTestsDialog.disciplineName, 
        disciplineTestsDialog.disciplineId
      );
      handleCloseTestsDialog();
    }}
  >
    Начать тест
  </Button>
</Tooltip>
                        <Tooltip title="Просмотреть пользователей, прошедших тест">
<Button
  variant="outlined"
  onClick={() => handleViewTestMarksClick(test, { id: disciplineTestsDialog.disciplineId, name: disciplineTestsDialog.disciplineName })}
>
  РЕЗУЛЬТАТЫ ТЕСТА
</Button>

</Tooltip>
                          <Tooltip title="Дополнительные действия">
                            <IconButton
                              size="small"
                              onClick={(event) => handleTestMenuOpen(
                                event,
                                { 
                                  id: disciplineTestsDialog.disciplineId, 
                                  name: disciplineTestsDialog.disciplineName 
                                },
                                test
                              )}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <QuizIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Тесты не найдены
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                В этой дисциплине пока нет созданных тестов
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleAddTestClick({
                  id: disciplineTestsDialog.disciplineId,
                  name: disciplineTestsDialog.disciplineName
                })}
              >
                Добавить первый тест
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestsDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ВОПРОСОВ ТЕСТА */}
      <Dialog 
        open={questionsDialog.open} 
        onClose={handleCloseQuestionsDialog} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <QuestionAnswerIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Список вопросов теста
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Тест: {questionsDialog.testName} • Дисциплина: {questionsDialog.disciplineName}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Добавить вопрос">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateQuestionClick}
                >
                  Добавить вопрос
                </Button>
              </Tooltip>
              <Tooltip title="Добавить существующий вопрос">
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestionToTestClick}
                >
                  Добавить существующий вопрос
                </Button>
              </Tooltip>
              <IconButton onClick={handleCloseQuestionsDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {questionsDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка вопросов...</Typography>
            </Box>
          ) : questionsDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {questionsDialog.error}</Typography>
            </Box>
          ) : questionsDialog.questions.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Информация о тесте
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {questionsDialog.disciplineName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Тест:</strong> {questionsDialog.testName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID теста:</strong> {questionsDialog.testId}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Всего вопросов:</strong> {questionsDialog.questions.length}
                    </Typography>
                   
<Tooltip title="Изменить порядок вопросов">
  <Button
    variant="outlined"
    startIcon={<FormatListBulletedIcon />}
    onClick={handleReorderQuestionsClick}
  >
    Порядок вопросов
  </Button>
</Tooltip>

<Tooltip title="Просмотреть пользователей, прошедших тест">
  <Button
    variant="outlined"
    startIcon={<PeopleIcon />}
    onClick={handleViewTestUsersClick}
  >
    Результаты теста
  </Button>
</Tooltip>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Список вопросов (показаны только последние версии)
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="40%">Название вопроса</TableCell>
                        <TableCell>Версия</TableCell>
                        <TableCell>ID автора</TableCell>
                        <TableCell>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {questionsDialog.questions.map((question, index) => (
                        <TableRow key={question.id || index} hover>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {question.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {question.rawQuestion?.question_text || question.rawQuestion?.text || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`v${question.version}`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {question.authorId || 'Не указан'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<InfoIcon />}
                                onClick={() => {
                                  // Здесь можно добавить функционал для просмотра деталей вопроса
                                  showSnackbar(`Детали вопроса: ${question.name} (версия ${question.version})`, 'info');
                                }}
                              >
                                Подробнее
                              </Button>
                              <Tooltip title="Дополнительные действия">
                                <IconButton
                                  size="small"
                                  onClick={(event) => handleQuestionMenuOpen(event, question)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  • Показаны только последние версии каждого вопроса<br />
                  • Если у вопроса несколько версий, отображается самая новая<br />
                  • ID автора указывает на пользователя, который создал или обновил вопрос<br />
                  • Для редактирования вопроса нажмите на кнопку с тремя точками
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <QuestionAnswerIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Вопросы не найдены
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                В этом тесте пока нет созданных вопросов
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleCreateQuestionClick}
                >
                  Добавить первый вопрос
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestionToTestClick}
                >
                  Добавить существующий вопрос
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuestionsDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ПРОХОЖДЕНИЯ ТЕСТА */}
<Dialog 
  open={startTestDialog.open} 
  onClose={handleCloseStartTestDialog} 
  maxWidth="md" 
  fullWidth
  fullScreen={true}
>
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <QuizIcon />
        </Avatar>
        <Box>
          <Typography variant="h6">
            Прохождение теста: {startTestDialog.testName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
  Дисциплина: {startTestDialog.disciplineName} • 
  Вопрос {startTestDialog.currentQuestionIndex + 1} из {startTestDialog.questions.length}
  {startTestDialog.attemptId && ` • ID попытки: ${startTestDialog.attemptId}`}
</Typography>
        </Box>
      </Box>
      <IconButton onClick={handleCloseStartTestDialog} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  
  <DialogContent dividers>
    {startTestDialog.loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка теста...</Typography>
      </Box>
    ) : startTestDialog.error ? (
      <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
        <Typography>Ошибка: {startTestDialog.error}</Typography>
        <Button onClick={handleCloseStartTestDialog} sx={{ mt: 1 }}>
          Закрыть
        </Button>
      </Box>
    ) : startTestDialog.questions.length > 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
        {/* Прогресс-бар */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={(startTestDialog.currentQuestionIndex + 1) / startTestDialog.questions.length * 100} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Прогресс: {Math.round((startTestDialog.currentQuestionIndex + 1) / startTestDialog.questions.length * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Отвечено: {Object.keys(startTestDialog.userAnswers).length} из {startTestDialog.questions.length}
            </Typography>
          </Box>
        </Box>
        
        {/* Текущий вопрос */}

{startTestDialog.questions[startTestDialog.currentQuestionIndex] && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
      Вопрос {startTestDialog.currentQuestionIndex + 1}: {startTestDialog.questions[startTestDialog.currentQuestionIndex].title}
    </Typography>
    
    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
      {startTestDialog.questions[startTestDialog.currentQuestionIndex].text}
    </Typography>
    
    {/* Варианты ответов */}
    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
      Выберите правильный ответ:
    </Typography>
    <RadioGroup
      value={startTestDialog.userAnswers[startTestDialog.currentQuestionIndex] || ''}
      onChange={(e) => handleAnswerSelect(startTestDialog.currentQuestionIndex, parseInt(e.target.value))}
    >
      {startTestDialog.questions[startTestDialog.currentQuestionIndex].options?.map((option, index) => (
        <FormControlLabel
          key={option.id || index}
          value={index.toString()}
          control={<Radio />}
          label={
            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              border: '1px solid',
              borderColor: startTestDialog.userAnswers[startTestDialog.currentQuestionIndex] === index ? 'primary.main' : 'divider',
              bgcolor: startTestDialog.userAnswers[startTestDialog.currentQuestionIndex] === index ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              width: '100%',
              ml: 1
            }}>
              <Typography variant="body1">
                {option.text}
              </Typography>
            </Box>
          }
          sx={{ 
            width: '100%',
            ml: 0,
            mb: 2,
            '& .MuiFormControlLabel-label': { width: '100%' }
          }}
        />
      ))}
    </RadioGroup>
  </Box>
)}
        
        {/* Панель навигации */}
        <Box sx={{ 
          position: 'sticky', 
          bottom: 0, 
          bgcolor: 'background.paper', 
          pt: 2, 
          pb: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handlePreviousQuestion}
              disabled={startTestDialog.currentQuestionIndex === 0}
              startIcon={<ChevronLeftIcon />}
            >
              Предыдущий вопрос
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Индикатор ответов на вопросы */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {startTestDialog.questions.map((_, index) => (
                  <Tooltip key={index} title={`Вопрос ${index + 1}`}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: startTestDialog.userAnswers[index] !== undefined ? 
                          (startTestDialog.currentQuestionIndex === index ? 'primary.main' : 'success.main') : 
                          (startTestDialog.currentQuestionIndex === index ? 'warning.main' : 'grey.500'),
                        cursor: 'pointer'
                      }}
                      onClick={() => setStartTestDialog(prev => ({
                        ...prev,
                        currentQuestionIndex: index
                      }))}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
            
{startTestDialog.currentQuestionIndex === startTestDialog.questions.length - 1 ? (
  <Button
    variant="contained"
    color="success"
    onClick={handleSubmitTest}
    disabled={startTestDialog.loading}
    endIcon={<SendIcon />}
    sx={{ ml: 2 }}
  >
    {startTestDialog.loading ? 'Отправка...' : 'Завершить тест'}
  </Button>
) : (
  <Button
    variant="contained"
    onClick={handleNextQuestion}
    endIcon={<ChevronRightIcon />}
  >
    Следующий вопрос
  </Button>
)}
          </Box>
        </Box>
      </Box>
    ) : (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <QuizIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Вопросы не загружены
        </Typography>
        <Button onClick={handleCloseStartTestDialog}>
          Закрыть
        </Button>
      </Box>
    )}
  </DialogContent>

</Dialog>

<Dialog open={testMarksDialog.open} onClose={handleCloseTestMarksDialog} maxWidth="sm" fullWidth>
  <DialogTitle>
    {testMarksDialog.testName} — результаты
  </DialogTitle>

  <DialogContent dividers>
    {testMarksDialog.loading && <CircularProgress />}
    {testMarksDialog.error && (
      <Typography sx={{ color: "error.main" }}>{testMarksDialog.error}</Typography>
    )}

    {!testMarksDialog.loading && !testMarksDialog.error && (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Mark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testMarksDialog.marks.map((row) => (
              <TableRow key={row.user_id}>
                <TableCell>{row.user_id}</TableCell>
                <TableCell>{row.mark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={handleCloseTestMarksDialog}>Закрыть</Button>
  </DialogActions>
</Dialog>

      {/* ДИАЛОГ СОЗДАНИЯ ВОПРОСА */}
      <Dialog 
        open={createQuestionDialog.open} 
        onClose={handleCloseCreateQuestionDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AddIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Создание нового вопроса
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Тест: {createQuestionDialog.testName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseCreateQuestionDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {createQuestionDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Создание вопроса...</Typography>
            </Box>
          ) : createQuestionDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {createQuestionDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Название вопроса *
                </Typography>
                <TextField
                  value={createQuestionDialog.title}
                  onChange={(e) => setCreateQuestionDialog(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите название вопроса"
                  size="small"
                  autoFocus
                  error={!createQuestionDialog.title.trim()}
                  helperText={!createQuestionDialog.title.trim() ? "Название вопроса не может быть пустым" : ""}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Текст вопроса *
                </Typography>
                <TextField
                  value={createQuestionDialog.questionText}
                  onChange={(e) => setCreateQuestionDialog(prev => ({
                    ...prev,
                    questionText: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите текст вопроса"
                  size="small"
                  multiline
                  rows={4}
                  error={!createQuestionDialog.questionText.trim()}
                  helperText={!createQuestionDialog.questionText.trim() ? "Текст вопроса не может быть пустым" : ""}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Варианты ответов (минимум 2) *
                </Typography>
                <Grid container spacing={2}>
                  {createQuestionDialog.answers.map((answer, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Radio
                          checked={createQuestionDialog.correctAnswerIndex === index}
                          onChange={() => setCreateQuestionDialog(prev => ({
                            ...prev,
                            correctAnswerIndex: index
                          }))}
                          disabled={!answer.trim()}
                        />
                        <TextField
                          value={answer}
                          onChange={(e) => {
                            const newAnswers = [...createQuestionDialog.answers];
                            newAnswers[index] = e.target.value;
                            setCreateQuestionDialog(prev => ({
                              ...prev,
                              answers: newAnswers
                            }));
                          }}
                          fullWidth
                          placeholder={`Вариант ответа ${index + 1}`}
                          size="small"
                          error={createQuestionDialog.correctAnswerIndex === index && !answer.trim()}
                          helperText={createQuestionDialog.correctAnswerIndex === index && !answer.trim() ? "Правильный ответ не может быть пустым" : ""}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  • Вопрос будет создан с версией 1<br />
                  • Отметьте правильный ответ, выбрав радиокнопку рядом с ним<br />
                  • Можно оставить пустыми неиспользуемые варианты ответов<br />
                  • После создания вопрос можно будет редактировать, создавая новые версии
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateQuestionDialog} disabled={createQuestionDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveCreateQuestion}
            variant="contained"
            disabled={createQuestionDialog.loading}
          >
            {createQuestionDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Создать вопрос'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ РЕДАКТИРОВАНИЯ ВОПРОСА */}
      <Dialog 
        open={editQuestionDialog.open} 
        onClose={handleCloseEditQuestionDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <EditIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Редактирование вопроса
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Текущая версия: {editQuestionDialog.currentVersion}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseEditQuestionDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {editQuestionDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Сохранение вопроса...</Typography>
            </Box>
          ) : editQuestionDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {editQuestionDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Текущие данные вопроса (версия {editQuestionDialog.currentVersion})
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Название:</strong> {editQuestionDialog.currentTitle}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Текст вопроса:</strong> {editQuestionDialog.currentQuestionText}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Новое название вопроса *
                </Typography>
                <TextField
                  value={editQuestionDialog.title}
                  onChange={(e) => setEditQuestionDialog(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите новое название вопроса"
                  size="small"
                  autoFocus
                  error={!editQuestionDialog.title.trim()}
                  helperText={!editQuestionDialog.title.trim() ? "Название вопроса не может быть пустым" : ""}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Новый текст вопроса *
                </Typography>
                <TextField
                  value={editQuestionDialog.questionText}
                  onChange={(e) => setEditQuestionDialog(prev => ({
                    ...prev,
                    questionText: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите новый текст вопроса"
                  size="small"
                  multiline
                  rows={4}
                  error={!editQuestionDialog.questionText.trim()}
                  helperText={!editQuestionDialog.questionText.trim() ? "Текст вопроса не может быть пустым" : ""}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Новые варианты ответов (минимум 2) *
                </Typography>
                <Grid container spacing={2}>
                  {editQuestionDialog.answers.map((answer, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Radio
                          checked={editQuestionDialog.correctAnswerIndex === index}
                          onChange={() => setEditQuestionDialog(prev => ({
                            ...prev,
                            correctAnswerIndex: index
                          }))}
                          disabled={!answer.trim()}
                        />
                        <TextField
                          value={answer}
                          onChange={(e) => {
                            const newAnswers = [...editQuestionDialog.answers];
                            newAnswers[index] = e.target.value;
                            setEditQuestionDialog(prev => ({
                              ...prev,
                              answers: newAnswers
                            }));
                          }}
                          fullWidth
                          placeholder={`Вариант ответа ${index + 1}`}
                          size="small"
                          error={editQuestionDialog.correctAnswerIndex === index && !answer.trim()}
                          helperText={editQuestionDialog.correctAnswerIndex === index && !answer.trim() ? "Правильный ответ не может быть пустым" : ""}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Важная информация
                </Typography>
                <Typography variant="body2">
                  • Будет создана новая версия вопроса ({editQuestionDialog.currentVersion + 1})<br />
                  • Старые версии вопроса сохранятся в истории<br />
                  • Отметьте правильный ответ, выбрав радиокнопку рядом с ним<br />
                  • Можно оставить пустыми неиспользуемые варианты ответов
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditQuestionDialog} disabled={editQuestionDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveEditQuestion}
            variant="contained"
            color="warning"
            disabled={editQuestionDialog.loading}
          >
            {editQuestionDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Сохранить новую версию'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ УДАЛЕНИЯ ВОПРОСА */}
      <Dialog 
        open={deleteQuestionDialog.open} 
        onClose={handleCloseDeleteQuestionDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <DeleteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Удаление вопроса
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {deleteQuestionDialog.questionTitle}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDeleteQuestionDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {deleteQuestionDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Удаление вопроса...</Typography>
            </Box>
          ) : deleteQuestionDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {deleteQuestionDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о вопросе
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Вопрос:</strong> {deleteQuestionDialog.questionTitle}
                </Typography>
                <Typography variant="body1">
                  <strong>ID вопроса:</strong> {deleteQuestionDialog.questionId}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon /> Внимание!
                </Typography>
                <Typography variant="body2">
                  Вы собираетесь удалить вопрос. Это действие нельзя отменить.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Важная информация о мягком удалении
                </Typography>
                <Typography variant="body2">
                  • Вопрос будет отмечен как удалённый (реально ничего не удаляется)<br />
                  • Если вопрос не используется в тестах (даже удалённых), его можно удалить<br />
                  • Если вопрос используется в тестах, удаление не произойдет<br />
                  • Вопрос можно будет восстановить через административный интерфейс
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Подтверждение удаления
                </Typography>
                <Typography variant="body2">
                  Для подтверждения удаления введите название вопроса:
                </Typography>
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
                    {deleteQuestionDialog.questionTitle}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Убедитесь, что вы удаляете правильный вопрос
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteQuestionDialog} disabled={deleteQuestionDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmDeleteQuestion}
            variant="contained"
            color="error"
            disabled={deleteQuestionDialog.loading}
          >
            {deleteQuestionDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Удалить вопрос'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ДОБАВЛЕНИЯ СУЩЕСТВУЮЩЕГО ВОПРОСА В ТЕСТ */}
      <Dialog 
        open={addQuestionToTestDialog.open} 
        onClose={handleCloseAddQuestionToTestDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AddIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Добавление существующего вопроса в тест
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Тест: {addQuestionToTestDialog.testName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseAddQuestionToTestDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {addQuestionToTestDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка вопросов...</Typography>
            </Box>
          ) : addQuestionToTestDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {addQuestionToTestDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Информация о тесте
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {addQuestionToTestDialog.disciplineName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Тест:</strong> {addQuestionToTestDialog.testName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID теста:</strong> {addQuestionToTestDialog.testId}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID дисциплины:</strong> {addQuestionToTestDialog.disciplineId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Выберите вопрос для добавления
                </Typography>
                
                {addQuestionToTestDialog.allQuestions.length > 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel id="question-select-label">Выберите вопрос</InputLabel>
                    <Select
                      labelId="question-select-label"
                      value={addQuestionToTestDialog.selectedQuestionId}
                      label="Выберите вопрос"
                      onChange={(e) => setAddQuestionToTestDialog(prev => ({
                        ...prev,
                        selectedQuestionId: e.target.value
                      }))}
                    >
                      {addQuestionToTestDialog.allQuestions.map((question) => (
                        <MenuItem key={question.id} value={question.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {question.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Версия: {question.version} • ID автора: {question.authorId || 'Не указан'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                              {question.rawQuestion?.question_text ? 
                                question.rawQuestion.question_text.substring(0, 100) + '...' : 
                                'Без текста'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Нет доступных вопросов для добавления
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleCloseAddQuestionToTestDialog();
                        handleCreateQuestionClick();
                      }}
                    >
                      Создать новый вопрос
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Важная информация
                </Typography>
                <Typography variant="body2">
                  • Вопрос будет добавлен в последнюю позицию теста<br />
                  • Если у теста уже есть попытки прохождения, добавить вопрос нельзя<br />
                  • После добавления вопроса тест можно будет активировать<br />
                  • Вопрос можно будет удалить из теста в любое время
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon /> Ограничения
                </Typography>
                <Typography variant="body2">
                  Вопрос можно добавить только если тест ещё не имеет попыток прохождения!
                  Если тест уже кто-то проходил, добавление новых вопросов невозможно.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddQuestionToTestDialog} disabled={addQuestionToTestDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveAddQuestionToTest}
            variant="contained"
            disabled={addQuestionToTestDialog.loading || !addQuestionToTestDialog.selectedQuestionId}
          >
            {addQuestionToTestDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Добавить вопрос в тест'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* МЕНЮ ДЕЙСТВИЙ ДЛЯ ДИСЦИПЛИНЫ */}
      <Menu
        anchorEl={disciplineMenuAnchor}
        open={Boolean(disciplineMenuAnchor)}
        onClose={handleDisciplineMenuClose}
      >
        {selectedDisciplineForAction && !selectedDisciplineForAction.deleted ? (
          <>
            <MenuItem onClick={() => handleDisciplineMenuAction('view')}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Просмотреть информацию</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleDisciplineMenuAction('tests')}>
              <ListItemIcon>
                <QuizIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Просмотреть тесты</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleDisciplineMenuAction('students')}>
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Просмотреть студентов</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleDisciplineMenuAction('delete')}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Удалить дисциплину</ListItemText>
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={() => handleDisciplineMenuAction('delete')}>
            <ListItemIcon>
              <UnarchiveIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'success.main' }}>Восстановить дисциплину</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* МЕНЮ ДЕЙСТВИЙ ДЛЯ ТЕСТА */}
      <Menu
        anchorEl={testMenuAnchor}
        open={Boolean(testMenuAnchor)}
        onClose={handleTestMenuClose}
      >
        <MenuItem onClick={() => handleTestMenuAction('check')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Проверить активность</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleTestMenuAction('activate')}>
          <ListItemIcon>
            {selectedTestForMenu?.state === 'active' ? 
              <PauseCircleOutlineIcon fontSize="small" /> : 
              <PlayCircleOutlineIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText>
            {selectedTestForMenu?.state === 'active' ? 'Деактивировать' : 'Активировать'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleTestMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Удалить тест</ListItemText>
        </MenuItem>
      </Menu>

      {/* МЕНЮ ДЕЙСТВИЙ ДЛЯ ВОПРОСА */}
      <Menu
        anchorEl={questionMenuAnchor}
        open={Boolean(questionMenuAnchor)}
        onClose={handleQuestionMenuClose}
      >
        <MenuItem onClick={() => handleQuestionMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать вопрос</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleQuestionMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Удалить вопрос</ListItemText>
        </MenuItem>
      </Menu>

      {/* ДИАЛОГ ПРОВЕРКИ АКТИВНОСТИ ТЕСТА */}
      <Dialog 
        open={testStateDialog.open} 
        onClose={handleCloseTestStateDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: testStateDialog.isActive ? 'success.main' : 'warning.main' }}>
                <QuizIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Статус теста
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {testStateDialog.testName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseTestStateDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {testStateDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Проверка статуса...</Typography>
            </Box>
          ) : testStateDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {testStateDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о тесте
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {testStateDialog.disciplineName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID дисциплины:</strong> {testStateDialog.disciplineId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Тест:</strong> {testStateDialog.testName}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID теста:</strong> {testStateDialog.testId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Статус теста
                </Typography>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: testStateDialog.isActive ? 'success.main' : 'warning.main',
                  bgcolor: testStateDialog.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                  textAlign: 'center'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {testStateDialog.isActive ? (
                      <>
                        <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
                        <Typography variant="h5" color="success.main">
                          Тест активен
                        </Typography>
                        <Typography variant="body1">
                          Тест можно пройти
                        </Typography>
                      </>
                    ) : (
                      <>
                        <WarningIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                        <Typography variant="h5" color="warning.main">
                          Тест неактивен
                        </Typography>
                        <Typography variant="body1">
                          Тест отображается в списке, но пройти его нельзя
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Что это значит?
                </Typography>
                <Typography variant="body2">
                  {testStateDialog.isActive 
                    ? 'Активный тест доступен для прохождения студентами. Его можно использовать для проверки знаний.'
                    : 'Неактивный тест виден в списке тестов дисциплины, но студенты не могут его пройти. Это может быть черновик или архивный тест.'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestStateDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ АКТИВАЦИИ/ДЕАКТИВАЦИИ ТЕСТА */}
      <Dialog 
        open={activateTestDialog.open} 
        onClose={handleCloseActivateTestDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: activateTestDialog.newActive ? 'success.main' : 'warning.main' }}>
                {activateTestDialog.newActive ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {activateTestDialog.newActive ? 'Активация теста' : 'Деактивация теста'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {activateTestDialog.testName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseActivateTestDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {activateTestDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Выполнение...</Typography>
            </Box>
          ) : activateTestDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {activateTestDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о тесте
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {activateTestDialog.disciplineName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID дисциплины:</strong> {activateTestDialog.disciplineId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Тест:</strong> {activateTestDialog.testName}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID теста:</strong> {activateTestDialog.testId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Текущий статус
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: activateTestDialog.currentActive ? 'success.main' : 'warning.main',
                  bgcolor: activateTestDialog.currentActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                  mb: 2
                }}>
                  <Typography variant="body1">
                    <strong>Текущий статус:</strong> {activateTestDialog.currentActive ? 'Активен' : 'Неактивен'}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Новый статус
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={activateTestDialog.newActive}
                    onChange={(e) => setActivateTestDialog(prev => ({
                      ...prev,
                      newActive: e.target.value === 'true'
                    }))}
                  >
                    <FormControlLabel 
                      value={true} 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PlayCircleOutlineIcon color="success" />
                          <Typography>Активировать тест</Typography>
                        </Box>
                      } 
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
                      Тест будет доступен для прохождения студентами
                    </Typography>
                    
                    <FormControlLabel 
                      value={false} 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PauseCircleOutlineIcon color="warning" />
                          <Typography>Деактивировать тест</Typography>
                        </Box>
                      } 
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Тест будет отображаться в списке, но пройти его нельзя. Все начатые попытки автоматически завершатся.
                    </Typography>
                  </RadioGroup>
                </FormControl>
              </Box>
              
              {!activateTestDialog.newActive && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon /> Важно!
                  </Typography>
                  <Typography variant="body2">
                    При деактивации теста все начатые попытки автоматически отмечаются как завершённые.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActivateTestDialog} disabled={activateTestDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveTestActivation}
            variant="contained"
            color={activateTestDialog.newActive ? "success" : "warning"}
            disabled={activateTestDialog.loading || activateTestDialog.currentActive === activateTestDialog.newActive}
          >
            {activateTestDialog.loading ? (
              <CircularProgress size={20} />
            ) : activateTestDialog.newActive ? (
              'Активировать'
            ) : (
              'Деактивировать'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ДОБАВЛЕНИЯ ТЕСТА */}
      <Dialog 
        open={addTestDialog.open} 
        onClose={handleCloseAddTestDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AddIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Добавление теста
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Дисциплина: {addTestDialog.disciplineName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseAddTestDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {addTestDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Создание теста...</Typography>
            </Box>
          ) : addTestDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {addTestDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о дисциплине
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {addTestDialog.disciplineName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>ID дисциплины:</strong> {addTestDialog.disciplineId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Название теста *
                </Typography>
                <TextField
                  value={addTestDialog.testName}
                  onChange={(e) => setAddTestDialog(prev => ({
                    ...prev,
                    testName: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите название теста"
                  size="small"
                  autoFocus
                  error={!addTestDialog.testName.trim()}
                  helperText={!addTestDialog.testName.trim() ? "Название теста не может быть пустым" : ""}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Описание теста
                </Typography>
                <TextField
                  value={addTestDialog.description}
                  onChange={(e) => setAddTestDialog(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите описание теста"
                  size="small"
                  multiline
                  rows={4}
                />
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  Новый тест будет создан с пустым списком вопросов. По умолчанию тест будет не активен.
                  После создания вы сможете добавить вопросы и активировать тест.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddTestDialog} disabled={addTestDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveTestAddition}
            variant="contained"
            disabled={addTestDialog.loading || !addTestDialog.testName.trim()}
          >
            {addTestDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Создать тест'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ РЕЗУЛЬТАТОВ ПОПЫТКИ ТЕСТА */}
<Dialog 
  open={viewAttemptDialog.open} 
  onClose={() => setViewAttemptDialog(prev => ({ ...prev, open: false }))} 
  maxWidth="md" 
  fullWidth
>
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <GradeIcon />
        </Avatar>
        <Box>
          <Typography variant="h6">
            Результаты попытки теста
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {viewAttemptDialog.testName} • {viewAttemptDialog.userName}
          </Typography>
        </Box>
      </Box>
      <IconButton onClick={() => setViewAttemptDialog(prev => ({ ...prev, open: false }))} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  
  <DialogContent dividers>
    {viewAttemptDialog.loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка результатов...</Typography>
      </Box>
    ) : viewAttemptDialog.error ? (
      <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
        <Typography>Ошибка: {viewAttemptDialog.error}</Typography>
      </Box>
    ) : viewAttemptDialog.questions.length > 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
        {/* Статистика */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2,
          border: '2px solid',
          borderColor: viewAttemptDialog.score >= 70 ? 'success.main' : 
                      viewAttemptDialog.score >= 50 ? 'warning.main' : 'error.main',
          bgcolor: viewAttemptDialog.score >= 70 ? 'rgba(76, 175, 80, 0.1)' : 
                   viewAttemptDialog.score >= 50 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          textAlign: 'center'
        }}>
          <Typography variant="h4" sx={{ 
            color: viewAttemptDialog.score >= 70 ? 'success.main' : 
                   viewAttemptDialog.score >= 50 ? 'warning.main' : 'error.main',
            mb: 1
          }}>
            {viewAttemptDialog.score}%
          </Typography>
          <Typography variant="body1">
            Правильных ответов: {viewAttemptDialog.questions.filter(q => q.is_correct).length} из {viewAttemptDialog.questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Статус: {viewAttemptDialog.status === 'completed' ? 'Завершено' : 'В процессе'}
          </Typography>
        </Box>
        
        {/* Список вопросов и ответов */}
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Ответы пользователя
          </Typography>
          
          {viewAttemptDialog.questions.map((question, index) => (
            <Card key={index} sx={{ mb: 2, border: '1px solid', 
              borderColor: question.is_correct ? 'success.main' : 'error.main' }}>
              <CardContent>
                <Box sx={{ 
                  p: 1, 
                  mb: 2, 
                  borderRadius: 1,
                  bgcolor: question.is_correct ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {question.is_correct ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CloseIcon color="error" />
                  )}
                  <Typography variant="body2" color={question.is_correct ? 'success.main' : 'error.main'}>
                    {question.is_correct ? 'Правильный ответ' : 'Неправильный ответ'}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Вопрос {index + 1}: {question.question_text}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Ответ пользователя:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.05)'
                    }}>
                      <Typography variant="body1">
                        {question.user_answer || 'Ответ не предоставлен'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {!question.is_correct && question.correct_answer && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                        Правильный ответ:
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'success.main',
                        bgcolor: 'rgba(76, 175, 80, 0.05)'
                      }}>
                        <Typography variant="body1">
                          {question.correct_answer}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    ) : (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <QuizIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Результаты не найдены
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Нет данных о результатах этой попытки
        </Typography>
      </Box>
    )}
  </DialogContent>
  
  <DialogActions>
    <Button onClick={() => setViewAttemptDialog(prev => ({ ...prev, open: false }))}>
      Закрыть
    </Button>
  </DialogActions>
</Dialog>

      {/* ДИАЛОГ УДАЛЕНИЯ ТЕСТА */}
      <Dialog 
        open={deleteTestDialog.open} 
        onClose={handleCloseDeleteTestDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <DeleteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Удаление теста
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {deleteTestDialog.testName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDeleteTestDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {deleteTestDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Удаление теста...</Typography>
            </Box>
          ) : deleteTestDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {deleteTestDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о тесте
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {deleteTestDialog.disciplineName}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID дисциплины:</strong> {deleteTestDialog.disciplineId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Тест:</strong> {deleteTestDialog.testName}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID теста:</strong> {deleteTestDialog.testId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon /> Внимание!
                </Typography>
                <Typography variant="body2">
                  Вы собираетесь удалить тест. Это действие нельзя отменить.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Важная информация
                </Typography>
                <Typography variant="body2">
                  • Тест будет отмечен как удалённый (реально ничего не удаляется)<br />
                  • Все оценки за этот тест перестанут отображаться, но тоже не удалятся<br />
                  • Тест можно будет восстановить через административный интерфейс
                </Typography>
              </Box>
                            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Подтверждение удаления
                </Typography>
                <Typography variant="body2">
                  Для подтверждения удаления введите название теста:
                </Typography>
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
                    {deleteTestDialog.testName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Убедитесь, что вы удаляете правильный тест
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteTestDialog} disabled={deleteTestDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmTestDeletion}
            variant="contained"
            color="error"
            disabled={deleteTestDialog.loading}
          >
            {deleteTestDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Удалить тест'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ УДАЛЕНИЯ ДИСЦИПЛИНЫ */}
      <Dialog 
        open={deleteDisciplineDialog.open} 
        onClose={handleCloseDeleteDisciplineDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <ArchiveIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Удаление дисциплины
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {deleteDisciplineDialog.disciplineName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDeleteDisciplineDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {deleteDisciplineDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Удаление дисциплины...</Typography>
            </Box>
          ) : deleteDisciplineDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {deleteDisciplineDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о дисциплине
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {deleteDisciplineDialog.disciplineName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>ID дисциплины:</strong> {deleteDisciplineDialog.disciplineId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon /> Внимание!
                </Typography>
                <Typography variant="body2">
                  Вы собираетесь удалить дисциплину. Это действие нельзя отменить.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Важная информация о мягком удалении
                </Typography>
                <Typography variant="body2">
                  • Дисциплина будет отмечена как удалённая (реально ничего не удаляется)<br />
                  • Все тесты и оценки перестанут отображаться, но тоже не удаляются<br />
                  • Студенты останутся записанными, но не смогут просматривать дисциплину<br />
                  • Дисциплину можно будет восстановить через меню "Показать удаленные"
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Последствия удаления
                </Typography>
                <Alert severity="warning">
                  После удаления дисциплины:
                  <ul>
                    <li>Студенты не смогут проходить тесты по этой дисциплине</li>
                    <li>Статистика и результаты сохранятся, но будут скрыты</li>
                    <li>Преподаватели не смогут добавлять новые тесты</li>
                    <li>Дисциплина переместится в архив</li>
                  </ul>
                </Alert>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Подтверждение удаления
                </Typography>
                <Typography variant="body2">
                  Для подтверждения удаления введите название дисциплины:
                </Typography>
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
                    {deleteDisciplineDialog.disciplineName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Убедитесь, что вы удаляете правильную дисциплину
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDisciplineDialog} disabled={deleteDisciplineDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmDeleteDiscipline}
            variant="contained"
            color="error"
            disabled={deleteDisciplineDialog.loading}
          >
            {deleteDisciplineDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Удалить дисциплину'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ВОССТАНОВЛЕНИЯ ДИСЦИПЛИНЫ */}
      <Dialog 
        open={restoreDisciplineDialog.open} 
        onClose={handleCloseRestoreDisciplineDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <UnarchiveIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Восстановление дисциплины
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {restoreDisciplineDialog.disciplineName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseRestoreDisciplineDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {restoreDisciplineDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Восстановление дисциплины...</Typography>
            </Box>
          ) : restoreDisciplineDialog.error ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {restoreDisciplineDialog.error}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о дисциплине
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Дисциплина:</strong> {restoreDisciplineDialog.disciplineName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>ID дисциплины:</strong> {restoreDisciplineDialog.disciplineId}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация о восстановлении
                </Typography>
                <Typography variant="body2">
                  • Дисциплина будет восстановлена из архива<br />
                  • Все тесты и оценки снова станут доступны<br />
                  • Студенты смогут продолжить обучение<br />
                  • Преподаватели смогут добавлять новые тесты
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Что произойдет после восстановления
                </Typography>
                <Alert severity="info">
                  После восстановления дисциплины:
                  <ul>
                    <li>Дисциплина снова появится в основном списке</li>
                    <li>Все тесты и задания станут доступны</li>
                    <li>Студенты смогут проходить тесты и просматривать результаты</li>
                    <li>Преподаватели смогут управлять дисциплиной как обычно</li>
                  </ul>
                </Alert>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Подтверждение восстановления
                </Typography>
                <Typography variant="body2">
                  Для подтверждения восстановления введите название дисциплины:
                </Typography>
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
                    {restoreDisciplineDialog.disciplineName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Убедитесь, что вы восстанавливаете правильную дисциплину
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDisciplineDialog} disabled={restoreDisciplineDialog.loading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmRestoreDiscipline}
            variant="contained"
            color="success"
            disabled={restoreDisciplineDialog.loading}
          >
            {restoreDisciplineDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Восстановить дисциплину'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ ПРОСМОТРА ПОЛЬЗОВАТЕЛЯ */}
      <Dialog 
        open={openUserDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {selectedUserInfo?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {selectedUserInfo?.full_name || selectedUserInfo?.name || 'Пользователь'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID: {selectedUserId}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseViewDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {userInfoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Загрузка информации...</Typography>
            </Box>
          ) : userInfoError ? (
            <Box sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
              <Typography>Ошибка: {userInfoError}</Typography>
            </Box>
          ) : selectedUserInfo ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Основная информация
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ФИО:</strong> {selectedUserInfo.full_name || selectedUserInfo.name || 'Не указано'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {selectedUserInfo.email || selectedUserInfo.mail || 'Не указан'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>ID:</strong> {selectedUserInfo.id}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Статус:</strong> {selectedUserInfo.blocked ? 'Заблокирован' : 'Активен'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Дополнительная информация
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Здесь может отображаться дополнительная информация о пользователе: дата регистрации, последний вход, и т.д.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Данные пользователя не загружены</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>
            Закрыть
          </Button>
          {selectedUserInfo && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditFromDialog}
              >
                Изменить ФИО
              </Button>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={handleEditRolesFromDialog}
              >
                Изменить роли
              </Button>
              <Button
                variant="outlined"
                color={selectedUserInfo.blocked ? "success" : "error"}
                startIcon={selectedUserInfo.blocked ? <LockOpenIcon /> : <LockIcon />}
                onClick={handleBlockFromDialog}
              >
                {selectedUserInfo.blocked ? 'Разблокировать' : 'Заблокировать'}
              </Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ РЕДАКТИРОВАНИЯ ФИО */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <EditIcon />
              </Avatar>
              <Typography variant="h6">
                Изменение ФИО пользователя
              </Typography>
            </Box>
            <IconButton onClick={handleCloseEditDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {saveLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Сохранение...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Текущее ФИО
                </Typography>
                <Typography variant="body1" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  {editUserData.currentName}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Новое ФИО *
                </Typography>
                <TextField
                  value={editUserData.newName}
                  onChange={(e) => setEditUserData(prev => ({
                    ...prev,
                    newName: e.target.value
                  }))}
                  fullWidth
                  placeholder="Введите новое ФИО"
                  size="small"
                  autoFocus
                  error={!editUserData.newName.trim()}
                  helperText={!editUserData.newName.trim() ? "ФИО не может быть пустым" : ""}
                />
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  После изменения ФИО пользователя, новая информация будет отображаться во всех разделах системы.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saveLoading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveName}
            variant="contained"
            disabled={saveLoading || !editUserData.newName.trim() || editUserData.newName === editUserData.currentName}
          >
            {saveLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ РЕДАКТИРОВАНИЯ РОЛЕЙ */}
      <Dialog 
        open={openRolesDialog} 
        onClose={handleCloseRolesDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h6">
                Изменение ролей пользователя
              </Typography>
            </Box>
            <IconButton onClick={handleCloseRolesDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {rolesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Сохранение...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Выберите роли пользователя
                </Typography>
                <FormGroup>
                  {AVAILABLE_ROLES.map((role) => (
                    <FormControlLabel
                      key={role.value}
                      control={
                        <Checkbox
                          checked={editRolesData.newRoles.includes(role.value)}
                          onChange={() => handleRoleChange(role.value)}
                          disabled={rolesLoading}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {role.icon}
                          <Typography>{role.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InfoIcon /> Информация
                </Typography>
                <Typography variant="body2">
                  • Администратор: полный доступ ко всем функциям системы<br />
                  • Преподаватель: может создавать дисциплины и тесты<br />
                  • Студент: может проходить тесты и просматривать результаты
                </Typography>
              </Box>
              
              {editRolesData.newRoles.length === 0 && (
                <Alert severity="warning">
                  Пользователь без ролей не сможет выполнять никакие действия в системе.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRolesDialog} disabled={rolesLoading}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveRoles}
            variant="contained"
            disabled={rolesLoading || JSON.stringify(editRolesData.newRoles.sort()) === JSON.stringify(editRolesData.currentRoles.sort())}
          >
            {rolesLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ДИАЛОГ БЛОКИРОВКИ/РАЗБЛОКИРОВКИ */}
      <Dialog 
        open={openBlockDialog} 
        onClose={handleCloseBlockDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: blockUserData.newBlocked ? 'error.main' : 'success.main' }}>
                {blockUserData.newBlocked ? <LockIcon /> : <LockOpenIcon />}
              </Avatar>
              <Typography variant="h6">
                {blockUserData.newBlocked ? 'Блокировка пользователя' : 'Разблокировка пользователя'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseBlockDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {blockLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Выполнение...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Информация о пользователе
                </Typography>
                <Typography variant="body1">
                  <strong>Пользователь:</strong> {blockUserData.name}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>ID:</strong> {blockUserData.id}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Текущий статус:</strong> {blockUserData.currentBlocked ? 'Заблокирован' : 'Активен'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {blockUserData.newBlocked ? 'Причина блокировки' : 'Причина разблокировки'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockDialog} disabled={blockLoading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmBlock}
            variant="contained"
            color={blockUserData.newBlocked ? "error" : "success"}
            disabled={blockLoading}
          >
            {blockLoading ? (
              <CircularProgress size={20} />
            ) : blockUserData.newBlocked ? (
              'Заблокировать'
            ) : (
              'Разблокировать'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* УВЕДОМЛЕНИЯ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default PersonalAccount;