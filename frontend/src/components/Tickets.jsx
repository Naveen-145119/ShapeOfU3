import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const Tickets = () => {
  return (
    <section id="tickets" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title text-gradient mb-8">Choose Your Experience</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Select the ticket that best fits your journey</p>
        </div>
        <div className="mt-12 max-w-lg mx-auto">
          <div className="ticket-card bg-card rounded-lg overflow-hidden shadow-lg border-2 border-primary">
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="card-title text-white mb-2">Ticket</h3>
                <p className="text-4xl font-bold text-primary">₹1,599</p>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span>Access to full 2-day experience</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span>Exclusive activities, workouts and community sessions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span>Special merch discounts and surprise extras</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span>A space that will challenge, inspire, and elevate you</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                  <span>Exclusive Upcoming Fitness Enterpreneurs water bottle</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/booking">
                  <Button className="w-full btn-gradient">Book Now!</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tickets;
