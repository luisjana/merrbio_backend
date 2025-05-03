const handleError = (res, error, message = 'Server error') => {
    console.error(error);
    res.status(500).json({ message, error: error.message });
  };
  
  module.exports = handleError;
  