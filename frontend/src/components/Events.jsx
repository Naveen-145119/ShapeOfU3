import marathonImage from '../assets/images/events/marathon_running_event.jpg';

const Events = () => {
  return (
    <section id="events" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title text-gradient mb-8">Marathon Events</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Make your Choice!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="event-card bg-card rounded-lg overflow-hidden shadow-lg">
            <div className="event-image relative">
              <img src={marathonImage} alt="Marathon Challenge" className="event-img w-full h-64 object-cover" />
              <div className="event-overlay absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
                <div className="event-badge bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold w-max">Marathon-5k</div>
              </div>
            </div>
            <div className="event-content p-6">
              <h3 className="card-title text-white mb-4">Marathon Challenge</h3>
              <div className="event-details space-y-2">
                <div className="event-detail flex justify-between">
                  <span className="detail-label text-muted-foreground">Distance:</span>
                  <span className="detail-value text-white font-semibold">Half-Marathon Run</span>
                </div>
              </div>
            </div>
          </div>
          <div className="event-card bg-card rounded-lg overflow-hidden shadow-lg">
            <div className="event-image relative">
              <img src={marathonImage} alt="Marathon Challenge" className="event-img w-full h-64 object-cover" />
              <div className="event-overlay absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
                <div className="event-badge bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold w-max">Marathon-10k</div>
              </div>
            </div>
            <div className="event-content p-6">
              <h3 className="card-title text-white mb-4">Marathon Challenge</h3>
              <div className="event-details space-y-2">
                <div className="event-detail flex justify-between">
                  <span className="detail-label text-muted-foreground">Distance:</span>
                  <span className="detail-value text-white font-semibold">Full-Marathon Run</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
