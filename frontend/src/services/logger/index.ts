/**
 * Сервис для логирования действий пользователя и ошибок
 * Позволяет сохранять логи на сервере для последующего анализа
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  data?: Record<string, any>;
  userId?: string | number | null;
  sessionId?: string;
  url?: string;
}

class LoggerService {
  private static instance: LoggerService;
  private logQueue: LogEntry[] = [];
  private readonly logEndpoint = '/api/v1/logs';
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushingQueue = false;
  private sessionId: string;

  private constructor() {
    // Генерируем уникальный ID сессии
    this.sessionId = Math.random().toString(36).substring(2, 15);
    
    // Автоматически отправляем логи каждые 10 секунд
    this.flushInterval = setInterval(() => this.flushQueue(), 10000);
    
    // Отправляем логи перед закрытием страницы
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushQueue(true));
    }
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Добавляет сообщение в очередь логов уровня DEBUG
   */
  public debug(message: string, source: string, data?: Record<string, any>): void {
    this.addToQueue('debug', message, source, data);
    console.debug(`[${source}] ${message}`, data || '');
  }

  /**
   * Добавляет сообщение в очередь логов уровня INFO
   */
  public info(message: string, source: string, data?: Record<string, any>): void {
    this.addToQueue('info', message, source, data);
    console.info(`[${source}] ${message}`, data || '');
  }

  /**
   * Добавляет сообщение в очередь логов уровня WARN
   */
  public warn(message: string, source: string, data?: Record<string, any>): void {
    this.addToQueue('warn', message, source, data);
    console.warn(`[${source}] ${message}`, data || '');
  }

  /**
   * Добавляет сообщение в очередь логов уровня ERROR
   */
  public error(message: string, source: string, data?: Record<string, any>): void {
    this.addToQueue('error', message, source, data);
    console.error(`[${source}] ${message}`, data || '');
  }

  /**
   * Добавляет сообщение в очередь логов
   */
  private addToQueue(level: LogLevel, message: string, source: string, data?: Record<string, any>): void {
    // Получаем ID пользователя из localStorage, если он есть
    let userId = null;
    try {
      if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          userId = user.id;
        }
      }
    } catch (e) {
      console.error('Ошибка при получении ID пользователя:', e);
    }

    // Добавляем запись в очередь
    this.logQueue.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      data,
      userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    });

    // Если в очереди накопилось 50+ записей, отправляем их
    if (this.logQueue.length >= 50) {
      this.flushQueue();
    }
  }

  /**
   * Вместо отправки на сервер только логируем в консоль
   */
  public async flushQueue(isSync: boolean = false): Promise<void> {
    if (this.logQueue.length === 0) {
      return;
    }

    this.isFlushingQueue = true;
    
    try {
      // Вместо отправки логов на сервер (отсутствующий эндпоинт) просто показываем их в консоли
      if (this.logQueue.length > 0) {
        console.debug(`[LoggerService] Логирование: ${this.logQueue.length} записей в очереди`);
      }
      
      // Очищаем очередь логов
      this.logQueue = [];
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Асинхронно отправляет логи на сервер
   */
  private sendLogsAsync = async (logs: LogEntry[]): Promise<void> => {
    try {
      const response = await fetch(this.logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка при отправке логов: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка при отправке логов:', error);
      throw error;
    }
  };

  /**
   * Синхронно отправляет логи на сервер (для события beforeunload)
   */
  private sendLogsSync = (logs: LogEntry[]): void => {
    try {
      // Используем синхронный XMLHttpRequest для отправки перед закрытием страницы
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.logEndpoint, false); // false = синхронный запрос
      xhr.setRequestHeader('Content-Type', 'application/json');
      const token = localStorage.getItem('accessToken') || '';
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(JSON.stringify({ logs }));
    } catch (error) {
      console.error('Ошибка при синхронной отправке логов:', error);
    }
  };
}

// Экспортируем singleton-инстанс сервиса
export const logger = LoggerService.getInstance();

// Добавляем обработчик глобальных ошибок
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error(
      event.message || 'Необработанная ошибка',
      'GlobalErrorHandler',
      {
        stack: event.error?.stack,
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error(
      event.reason?.message || 'Необработанное отклонение промиса',
      'GlobalPromiseHandler',
      {
        stack: event.reason?.stack,
        reason: event.reason
      }
    );
  });
}

export default logger;
