import Hero from '../components/Hero';
import About from '../components/About';
import Events from '../components/Events';
import Tickets from '../components/Tickets';
import TeamBuilding from '../components/TeamBuilding';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <About />
      <Events />
      <TeamBuilding />
      <Tickets />
    </div>
  );
};

export default HomePage;
