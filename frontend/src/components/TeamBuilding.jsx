import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

import humanTunnel from '../assets/images/team-building/human_tunnel.jpg';
import hulaHoop from '../assets/images/team-building/hula_hoop_pass.jpg';
import tugOfWar from '../assets/images/team-building/tug_of_war.jpg';
import skiBoard from '../assets/images/team-building/ski_board.jpg';
import scavengerHunt from '../assets/images/team-building/human_scavenger_hunt.jpg';
import tarpWalk from '../assets/images/team-building/tarp_walk.jpg';
import halfPipe from '../assets/images/team-building/half_pipe_rolling_ball.jpg';
import grabIt from '../assets/images/team-building/grab_it_first.jpg';

const activities = [
  { img: humanTunnel, title: 'Human Tunnel', desc: 'Build trust and coordination as team members crawl through a human tunnel formation.' },
  { img: hulaHoop, title: 'Hula Hoop Pass', desc: 'Pass the hula hoop around the circle without breaking hands - teamwork at its best!' },
  { img: tugOfWar, title: 'Tug of War', desc: 'Classic team strength competition that builds unity and competitive spirit.' },
  { img: skiBoard, title: 'Ski Board', desc: 'Walk together on shared planks - perfect synchronization and communication required.' },
  { img: scavengerHunt, title: 'Human Scavenger Hunt', desc: 'Find people with specific traits or experiences - great for getting to know each other.' },
  { img: tarpWalk, title: 'Tarp Walk', desc: 'Navigate obstacles together while staying on the tarp - ultimate teamwork challenge.' },
  { img: halfPipe, title: 'Half Pipe Rolling Ball', desc: 'Guide a ball through connected half-pipes with perfect timing and coordination.' },
  { img: grabIt, title: 'Grab It First', desc: 'Quick reflexes and competitive spirit shine in this fast-paced reaction game.' },
];

const TeamBuilding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollLeft = () => {
    setCurrentIndex(prev => (prev === 0 ? activities.length - 1 : prev - 1));
  };

  const scrollRight = useCallback(() => {
    setCurrentIndex(prev => (prev === activities.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      scrollRight();
    }, 3000);
    return () => clearInterval(interval);
  }, [scrollRight]);

  return (
    <section id="team-building" className="py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title text-gradient mb-8">Team Building Activities</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Fun Games for Team Bonding</p>
        </div>
        <div className="relative mt-12">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-8"
              animate={{ x: `-${currentIndex * 100 / 3}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {activities.map((activity, index) => (
                <div key={index} className="flex-shrink-0 w-full md:w-1/3">
                  <div className="team-card bg-card rounded-lg overflow-hidden shadow-lg h-full">
                    <div className="team-card-image relative">
                      <img src={activity.img} alt={activity.title} className="team-img w-full h-64 object-cover" />
                      <div className="team-card-overlay absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
                        <div className="team-badge bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold w-max">Team Game</div>
                      </div>
                    </div>
                    <div className="team-card-content p-6">
                      <h3 className="card-title text-white mb-4">{activity.title}</h3>
                      <p className="text-muted-foreground">{activity.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
          <Button onClick={scrollLeft} className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10" variant="outline" size="icon"><ChevronLeft /></Button>
          <Button onClick={scrollRight} className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10" variant="outline" size="icon"><ChevronRight /></Button>
        </div>
      </div>
    </section>
  );
};

export default TeamBuilding;
