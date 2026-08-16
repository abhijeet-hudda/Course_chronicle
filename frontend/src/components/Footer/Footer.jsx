import { Link } from "react-router-dom";
import { Assets } from "../../assets/Assets";
import { SOCIAL_LINKS } from "../../config/socialLinks";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 pt-10 pb-5">
      <div className="container mx-auto px-6 flex gap-8 justify-between">
        <div className="col-span-1">
          <Link to="/">
            <img src={Assets.logo} width={100} alt="logo" />
          </Link>
          <p className="text-xl mt-5">
            Helping students by sharing and solving questions with knowledge and credits.
          </p>
          <p className="text-lg mt-2">
            Created by{" "}
            <Link to="/aboutUs" className="hover:underline text-blue-400">
              Team
            </Link>
            , 2025
          </p>
        </div>

        <div className="flex space-x-20">
          <div>
            <h3 className="text-white font-medium mb-2">Navigation</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/" className="hover:underline hover:text-white">Home</Link></li>
              <li><Link to="/upload" className="hover:underline hover:text-white">Upload</Link></li>
              <li><Link to="/aboutUs" className="hover:underline hover:text-white">About</Link></li>
              <li><Link to="/subscription" className="hover:underline hover:text-white">Subscription</Link></li>
              <li><Link to="/papers" className="hover:underline hover:text-white">Papers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-2">Resources</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/papers" className="hover:underline hover:text-white">Papers</Link></li>
              <li><Link to="/subscription" className="hover:underline hover:text-white">Plans and Pricing</Link></li>
            </ul>
          </div>

          {/* Fill in SOCIAL_LINKS in src/config/socialLinks.js with your real
              profile URLs — left as "#" on purpose so nothing ships with
              placeholder links. */}
          <div>
            <h3 className="text-white font-medium mb-2">Follow Us</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <img src={Assets.instagram_icon} alt="Instagram" className="w-4 h-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <img src={Assets.facebook_icon} alt="Facebook" className="w-4 h-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <img src={Assets.twitter_icon} alt="Twitter" className="w-4 h-4" />
                  Twitter
                </a>
              </li>
              <li>
                <a href={SOCIAL_LINKS.email} className="hover:underline hover:text-white">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-10 border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
        © 2025 Xamgen™. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
