import aboutImage from '../assets/images/sections/about_us_community.jpg';

const About = () => {
  return (
    <section id="about" className="py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title text-gradient mb-8">About Shape of You 3</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-lg text-muted-foreground">
            <p className="mb-6">
              In a world where everyone talks about change but few have the structure to follow through, sometimes all it takes is being part of something bigger--
              something that grounds you, challenges you, and reminds you who you're becoming.
            </p>
            <p className="mb-6">
              That's what Shape of You 3 has always been about: discipline, identity, real growth, and
              a community that doesn't let you shrink. What started as a vision turns into a global
              movement -- one that's been growing louder with every step. The ultimate movement
              for those who don't play small.
            </p>
            <p>
              1st Edition - Upcoming Fitness Enterpreneurs 
              Exciting news we are going to start in your city, in Bangalore Avalahalli and next
              Hyderabad, Anantapur and more city's . Prajwal, Sai, Kranthi and pradeep ----hosting
              daily fitness parties with over hundred of people in  Andhra Pradesh alone, proving that
              upcoming fitness entrepreneurs was now a cultural movement.
            </p>
          </div>
          <div>
            <img src={aboutImage} alt="About Shape of You 3" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
