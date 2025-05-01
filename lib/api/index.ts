
export * from './types';
export { default as apiClient } from './config';
export * from './auth';
export * from './access';
export * from './security';
export * from './parking';
export * from './notifications';
export * from './reports';

// También exportar servicios con nombres específicos para mantener compatibilidad
import * as authService from './auth';
import * as accessService from './access';
import * as securityService from './security';
import * as parkingService from './parking';
import * as notificationService from './notifications';
import * as reportService from './reports';

export {
  authService,
  accessService,
  securityService,
  parkingService,
  notificationService,
  reportService
};