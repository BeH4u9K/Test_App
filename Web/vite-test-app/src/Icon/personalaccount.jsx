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
  Tooltip
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

  // Детальная информация о дисциплине
  const [disciplineDetail, setDisciplineDetail] = useState(null);

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
              ) : disciplines.length > 0 ? (
                <Grid container spacing={3}>
                  {disciplines.map((discipline) => (
                    <Grid item xs={12} md={6} lg={4} key={discipline.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6,
                          }
                        }}
                      >
                        <CardHeader
                          title={
                            <Typography variant="h6" sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {discipline.name}
                            </Typography>
                          }
                          subheader={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <NumbersIcon fontSize="small" />
                              <Typography variant="body2">ID: {discipline.id}</Typography>
                            </Box>
                          }
                          avatar={
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <SchoolIcon />
                            </Avatar>
                          }
                          action={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Tooltip title="Просмотреть подробности">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleViewDisciplineClick(discipline)}
                                >
                                  <InfoIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Просмотреть тесты">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleViewDisciplineTests(discipline)}
                                >
                                  <QuizIcon />
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<InfoIcon />}
                                onClick={() => handleViewDisciplineClick(discipline)}
                                sx={{ flex: 1 }}
                              >
                                Информация
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<QuizIcon />}
                                onClick={() => handleViewDisciplineTests(discipline)}
                                sx={{ flex: 1 }}
                              >
                                Тесты
                              </Button>
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
                    Дисциплины не найдены
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    В системе пока нет зарегистрированных дисциплин
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateDisciplineClick}
                    sx={{ mr: 2 }}
                  >
                    Создать первую дисциплину
                  </Button>
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
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<QuizIcon />}
                      onClick={() => {
                        handleCloseDisciplineDialog();
                        handleViewDisciplineTests(disciplineDialog.data);
                      }}
                    >
                      Просмотреть тесты дисциплины
                    </Button>
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
            <IconButton onClick={handleCloseTestsDialog} size="small">
              <CloseIcon />
            </IconButton>
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestsDialog}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Остальные диалоги (просмотр пользователя, редактирование ФИО, ролей, блокировки) */}
      {/* Они остаются такими же как в оригинальном коде */}
      
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