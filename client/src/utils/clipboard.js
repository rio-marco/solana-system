/**
 * Universal clipboard copy helper supporting secure contexts (https/localhost)
 * and fallback for non-secure HTTP IP access (http://192.168.0.131).
 */
export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback if writeText permission fails
    }
  }

  // Legacy execCommand fallback for plain HTTP IP access
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
};
