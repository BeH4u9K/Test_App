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
  { text: 'Тест' },
  { text: 'Дисциплина' },
  { text: 'Преподаватель' },
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
    reason: '',
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

  const userId = '1';

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

  // ============= ОСНОВНЫЕ ФУНКЦИИ ЗАГРУЗКИ =============

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
          isBlocked = blockData.blocked || false;
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
              isBlocked = blockData.blocked || false;
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
        isBlocked = blockData.blocked || false;
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
      
      const response = await fetch(`${API_BASE_URL}/disciplines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(disciplineData),
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

  // 6. Активировать/деактивировать тест
  const updateTestState = async (disciplineId, testId, active) => {
    try {
      setActivateTestDialog(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/tests/${testId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: active
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

  // 10. Записать пользователя на дисциплину
  const addStudentToDiscipline = async (disciplineId, studentId) => {
    try {
      setDisciplineStudentsDialog(prev => ({
        ...prev,
        addStudentDialog: { ...prev.addStudentDialog, loading: true, error: '' }
      }));
      
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Обновляем список студентов
      await fetchDisciplineStudents(disciplineId);
      
      showSnackbar('Пользователь успешно записан на дисциплину!', 'success');
      return true;
      
    } catch (err) {
      console.error('Ошибка записи пользователя на дисциплину:', err);
      setDisciplineStudentsDialog(prev => ({
        ...prev,
        addStudentDialog: { ...prev.addStudentDialog, error: err.message, loading: false }
      }));
      showSnackbar(`Ошибка записи пользователя: ${err.message}`, 'error');
      throw err;
    }
  };

  // 11. Отчислить пользователя с дисциплины
  const removeStudentFromDiscipline = async (disciplineId, studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/disciplines/${disciplineId}/users/${studentId}`, {
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
  const updateUserBlockStatus = async (userId, blocked, reason = '') => {
    try {
      setBlockLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocked: blocked,
          reason: reason || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const action = blocked ? 'заблокирован' : 'разблокирован';
      showSnackbar(`Пользователь успешно ${action}!`, 'success');
      
      // Обновляем статус блокировки
      setBlockStatuses(prev => ({
        ...prev,
        [userId]: blocked
      }));
      
      // Обновить данные в UI
      if (selectedUserInfo?.id === userId) {
        setSelectedUserInfo({
          ...selectedUserInfo,
          blocked: blocked
        });
      }
      
      if (activeTab === 'Участники') {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, blocked: blocked }
              : user
          )
        );
      }
      
      return result;
      
    } catch (err) {
      console.error('Ошибка обновления статуса блокировки:', err);
      showSnackbar(`Ошибка: ${err.message}`, 'error');
      throw err;
    } finally {
      setBlockLoading(false);
    }
  };

  // ============= ОБРАБОТЧИКИ СОБЫТИЙ =============

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
    
    if (!studentId.trim()) {
      showSnackbar('Выберите пользователя для записи', 'warning');
      return;
    }
    
    try {
      await addStudentToDiscipline(
        disciplineStudentsDialog.disciplineId,
        studentId
      );
      handleCloseAddStudentDialog();
    } catch (err) {
      // Ошибка уже обработана
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

  // Закрытие диалога восстановления дисциплины
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
      handleCloseRolesDialog();
    } catch (err) {
      // Ошибка уже обработана
    }
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
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {userRoles.length > 0 ? (
                          userRoles.map((role, index) => {
                            const RoleIcon = getRoleIcon(role);
                            return (
                              <Chip
                                key={index}
                                label={role}
                                icon={RoleIcon}
                                size="small"
                                color={getRoleChipColor(role)}
                                variant="outlined"
                              />
                            );
                          })
                        ) : (
                          <Chip label="Без ролей" size="small" color="default" />
                        )}
                      </Box>
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
                        <TableCell>Email</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Роли</TableCell>
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
                            <TableCell>{user.email || user.mail || '—'}</TableCell>
                            <TableCell>
                              {getBlockStatusComponent(user.id)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {user.roles && user.roles.length > 0 ? (
                                  user.roles.map((role, index) => {
                                    const RoleIcon = getRoleIcon(role);
                                    return (
                                      <Chip
                                        key={index}
                                        label={role}
                                        icon={RoleIcon}
                                        size="small"
                                        color={getRoleChipColor(role)}
                                        variant="outlined"
                                      />
                                    );
                                  })
                                ) : (
                                  <Chip label="Без ролей" size="small" color="default" />
                                )}
                              </Box>
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

          {/* ОСТАЛЬНЫЕ ВКЛАДКИ */}
          {activeTab === 'Тест' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Тесты</Typography>
              <Typography variant="body1">
                Функционал тестов будет реализован позже...
              </Typography>
            </Paper>
          )}

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
            disabled={disciplineStudentsDialog.addStudentDialog.loading || !disciplineStudentsDialog.addStudentDialog.studentId}
            startIcon={<PersonAddIcon />}
          >
            {disciplineStudentsDialog.addStudentDialog.loading ? (
              <CircularProgress size={20} />
            ) : (
              'Записать студента'
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
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
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Роли пользователя
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedUserInfo.roles && selectedUserInfo.roles.length > 0 ? (
                    selectedUserInfo.roles.map((role, index) => {
                      const RoleIcon = getRoleIcon(role);
                      return (
                        <Chip
                          key={index}
                          label={role}
                          icon={RoleIcon}
                          size="medium"
                          color={getRoleChipColor(role)}
                          variant="outlined"
                        />
                      );
                    })
                  ) : (
                    <Chip label="Без ролей" size="medium" color="default" />
                  )}
                </Box>
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
                <TextField
                  value={blockUserData.reason}
                  onChange={(e) => setBlockUserData(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  fullWidth
                  placeholder={blockUserData.newBlocked ? "Укажите причину блокировки..." : "Укажите причину разблокировки..."}
                  size="small"
                  multiline
                  rows={3}
                />
              </Box>
              
              {blockUserData.newBlocked ? (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon /> Внимание!
                  </Typography>
                  <Typography variant="body2">
                    • Заблокированный пользователь не сможет войти в систему<br />
                    • Все его текущие сессии будут завершены<br />
                    • Пользователь может быть разблокирован в любой момент
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InfoIcon /> Информация
                  </Typography>
                  <Typography variant="body2">
                    После разблокировки пользователь сможет войти в систему со своим текущим паролем.
                  </Typography>
                </Box>
              )}
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
            disabled={blockLoading || (blockUserData.newBlocked && !blockUserData.reason.trim())}
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