'use client';

import { useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { authService } from '../../../../lib/api';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (formData.new_password !== formData.confirm_password) {
      setError('Las contraseñas nuevas no coinciden');
      return false;
    }
    
    if (formData.new_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authService.changePassword(formData);
      setSuccess('Contraseña actualizada correctamente');
      
      // Limpiar el formulario
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(errorMessages || 'Error al cambiar la contraseña');
        }
      } else {
        setError('Error al cambiar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cambiar Contraseña</h1>

        {error && (
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Actualizar contraseña</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Introduce tu contraseña actual y la nueva contraseña.</p>
          </div>
          <div className="border-t border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <div className="mt-1">
                  <input
                    id="current_password"
                    name="current_password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.current_password}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="new_password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.new_password}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">La contraseña debe tener al menos 8 caracteres.</p>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}