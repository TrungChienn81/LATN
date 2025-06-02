import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

/**
 * A reusable confirmation dialog component
 * @param {Object} props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {function} props.onClose - Handler for dialog close
 * @param {function} props.onConfirm - Handler for confirmation action
 * @param {string} props.title - Dialog title
 * @param {string} props.content - Dialog content text
 * @param {string} [props.confirmText='Xác nhận'] - Text for confirm button
 * @param {string} [props.cancelText='Hủy'] - Text for cancel button
 * @param {string} [props.confirmButtonColor='error'] - Color of confirm button
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmButtonColor = 'error'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color={confirmButtonColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 