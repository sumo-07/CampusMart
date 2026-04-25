import '../components/css/contact.css';

export const Contact = () => {
  return (
    <section className="section-contact">
      <div className="container contact-container">

        {/* Page Header */}
        <div className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            We’d love to hear from you. Reach out anytime.
          </p>
        </div>

        {/* Contact Content */}
        <div className="contact-content">

          {/* Left Side - Map */}
          <div className="contact-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3267.1065738322595!2d76.65720287536416!3d30.516086474689473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390fc32344a6e2d7%3A0x81b346dee91799ca!2sChitkara%20University!5e1!3m2!1sen!2sin!4v1771944217295!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CampusMart Location"
            ></iframe>
          </div>

          {/* Right Side - Form */}
          <div className="contact-form">
            <form>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="Enter your name" />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="Enter your email" />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows="5"
                  placeholder="Write your message..."
                ></textarea>
              </div>

              <button type="submit" className="form-btn form-btn-primary">
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};