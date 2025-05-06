const Footer = () => {
  return (
    <footer className="bg-light text-center text-muted py-3 mt-5 border-top">
      <div className="container">
        <small>© {new Date().getFullYear()} QR Scanner App</small>
      </div>
    </footer>
  );
};

export default Footer;
