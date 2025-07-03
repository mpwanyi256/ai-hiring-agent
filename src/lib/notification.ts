import { toast } from "sonner";

export const apiSuccess = (message: string) => {
  toast.success(message);
};

export const apiError = (message: string) => {
  toast.error(message);
};

export const apiWarning = (message: string) => {
  toast.warning(message);
};

export const apiInfo = (message: string) => {
  toast.info(message);
};
