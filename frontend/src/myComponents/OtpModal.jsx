import "../styles/OtpModal.css";
const SafeModal = ({ show, onClose, onSubmit, otp, setOtp }) => {
  if (!show) return null;

  return (
    <>
      <div className="safe-modal-backdrop"></div>

      <div className="safe-modal fade show">
        <div className="safe-modal-dialog">
          <div className="safe-modal-content">

            <div className="safe-modal-header">
              <h5 className="safe-modal-title">Verify Email</h5>
            </div>

            <div className="safe-modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div className="safe-modal-footer">
              <button className="safe-btn safe-btn-secondary" onClick={onClose}>Close</button>
              <button className="safe-btn safe-btn-primary" onClick={onSubmit}>Verify</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
export default SafeModal;