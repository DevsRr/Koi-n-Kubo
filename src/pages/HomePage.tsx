import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const HomePage = () => {
  const [featuredItems] = useState([
    { id: 1, name: 'Tonkotsu Ramen', price: 160, image: '/images/tonkotsu-ramen.jpg' },
    { id: 2, name: 'Pork Katsu', price: 149, image: '/images/pork-katsu.jpg' },
    { id: 3, name: 'Tantamen', price: 180, image: '/images/tantamen.jpg' },
    { id: 4, name: 'Chicken Katsu', price: 139, image: '/images/chicken-katsu.jpg' },
  ]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-6"
          >
            <img 
              src="/images/logo.png" 
              alt="KOI 'N KUBO" 
              className="w-32 h-32 md:w-48 md:h-48 mx-auto object-contain drop-shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
          >
            KOI 'N KUBO
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-orange-400 font-medium mb-2"
          >
            Japanese-Filipino Fusion Cuisine
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
          >
            Experience the perfect blend of authentic Japanese flavors with Filipino warmth. 
            From our signature Katsu Bowls to soul-warming Ramen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/menu">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Order Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-6 text-lg rounded-full"
              >
                View Menu
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-orange-500">KOI 'N KUBO</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We bring you the best of both worlds - authentic Japanese cooking techniques 
              combined with the heart and soul of Filipino hospitality.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Star,
                title: 'Premium Quality',
                description: 'Only the freshest ingredients sourced daily for authentic flavors'
              },
              {
                icon: Clock,
                title: 'Fast Delivery',
                description: 'Hot and fresh meals delivered to your doorstep in 30-45 minutes'
              },
              {
                icon: MapPin,
                title: 'Local Favorite',
                description: 'Proudly serving our community with love and dedication'
              }
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors"
              >
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured <span className="text-orange-500">Dishes</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our most loved dishes, crafted with passion and served with pride
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredItems.map((item) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group relative bg-gray-800 rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1f2937/ffffff?text=${encodeURIComponent(item.name)}`;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-orange-400 font-semibold">₱{item.price.toFixed(2)}</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link to="/menu">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/menu">
              <Button 
                variant="outline" 
                size="lg"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                View Full Menu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Phone className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
              <p className="text-orange-100">+63 912 345 6789</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Clock className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Opening Hours</h3>
              <p className="text-orange-100">Mon-Sun: 10AM - 10PM</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MapPin className="w-10 h-10 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Location</h3>
              <p className="text-orange-100">32 M.H. Del Pilar st. Tugatog Malabon City</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">KOI 'N KUBO</h4>
              <p className="text-sm">
                Bringing the best of Japanese-Filipino fusion cuisine to your table.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-orange-500 transition-colors">Home</Link></li>
                <li><Link to="/menu" className="hover:text-orange-500 transition-colors">Menu</Link></li>
                <li><Link to="/login" className="hover:text-orange-500 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/menu" className="hover:text-orange-500 transition-colors">Katsu Bowls</Link></li>
                <li><Link to="/menu" className="hover:text-orange-500 transition-colors">Ramen</Link></li>
                <li><Link to="/menu" className="hover:text-orange-500 transition-colors">Rice Meals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/KoiandKubo" className="hover:text-orange-500 transition-colors">Facebook</a>
                <a href="#" className="hover:text-orange-500 transition-colors">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 KOI 'N KUBO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
