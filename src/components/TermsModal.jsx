// Terms & Conditions shown from the registration screen.
export default function TermsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide">Terms &amp; Conditions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-gray-300">
          <p>
            Welcome to Dalevision. By creating an account you agree to the following terms.
            Please read them carefully.
          </p>

          <div>
            <h3 className="mb-1 font-semibold text-white">1. Account &amp; Approval</h3>
            <p>
              New accounts require administrator approval before access is granted. You are
              responsible for keeping your login credentials secure and for all activity under
              your account.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-white">2. Acceptable Use</h3>
            <p>
              You agree to use Dalevision only for lawful, personal, non-commercial purposes.
              You will not attempt to disrupt the service, abuse other users, or share your
              account for mass distribution.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-white">3. Third-Party Content</h3>
            <p>
              Dalevision displays metadata from TMDB and embeds video from independent
              third-party sources. We do not host, upload, or control that content and are not
              responsible for its availability, accuracy, or legality. You are responsible for
              ensuring your use complies with the laws of your country.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-white">4. Privacy</h3>
            <p>
              Your display name, email, avatar, approval status, and watch history are stored in
              Firebase to operate the service. We do not sell your data. Camera/microphone in
              Watch Together are used only for live sessions you join.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-white">5. No Warranty &amp; Termination</h3>
            <p>
              The service is provided “as is,” without warranties of any kind. Access may be
              suspended or terminated at any time, including for violations of these terms.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            By checking “I agree” and creating an account, you accept these Terms &amp;
            Conditions.
          </p>
        </div>

        <button onClick={onClose} className="btn-primary mt-5 w-full">
          Close
        </button>
      </div>
    </div>
  )
}
