import axios from 'axios';

/**
 * Safely parses any caught error object (especially Axios errors) 
 * into a user-friendly error message string.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    
    // Centralized custom error status mapping
    if (status === 401) {
      return "Please login again";
    }
    if (status === 409) {
      return "Selected seats are no longer available";
    }
    if (status === 410) {
      return "Reservation expired";
    }
    if (status === 500) {
      return "Something went wrong";
    }

    const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
    if (data?.message) {
      return data.message;
    }
    if (data?.errors && data.errors.length > 0) {
      return data.errors.join(', ');
    }
    return error.message || 'A network error occurred while communicating with the server.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export default getApiErrorMessage;
