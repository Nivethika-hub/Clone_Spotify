import React from 'react';
import { CheckCircle2, Crown, Download, Music4 } from 'lucide-react';

const plans = [
  {
    name: 'Premium Individual',
    price: 'Rs. 119',
    period: 'for 1 month',
    features: ['Ad-free listening', 'Download 10 Tamil songs', 'Unlimited skips', 'High quality audio'],
  },
  {
    name: 'Premium Duo',
    price: 'Rs. 149',
    period: 'for 1 month',
    features: ['2 Premium accounts', 'Separate libraries', 'Ad-free listening', 'Shared Tamil mix'],
  },
];

const PremiumPage = () => (
  <div className="page">
    <section className="hero-panel premium-hero">
      <div className="hero-copy">
        <span className="eyebrow">Premium</span>
        <h1>Upgrade your Tamil listening.</h1>
        <p>Choose a simple monthly plan with Spotify-style benefits and a clearer listening experience.</p>
      </div>
      <div className="hero-stats">
        <div className="stat-card">
          <Crown size={18} />
          <div>
            <strong>Ad-free</strong>
            <span>No interruptions</span>
          </div>
        </div>
        <div className="stat-card">
          <Download size={18} />
          <div>
            <strong>Offline ready</strong>
            <span>Song downloads</span>
          </div>
        </div>
        <div className="stat-card">
          <Music4 size={18} />
          <div>
            <strong>Unlimited skips</strong>
            <span>Play what you want</span>
          </div>
        </div>
      </div>
    </section>

    <section className="card-grid premium-grid">
      {plans.map((plan) => (
        <article className="panel premium-card" key={plan.name}>
          <span className="eyebrow">{plan.name}</span>
          <h2>{plan.price}</h2>
          <p>{plan.period}</p>
          <div className="premium-feature-list">
            {plan.features.map((feature) => (
              <div className="premium-feature" key={feature}>
                <CheckCircle2 size={16} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <button className="primary-button" type="button">
            Get Premium
          </button>
        </article>
      ))}
    </section>
  </div>
);

export default PremiumPage;
