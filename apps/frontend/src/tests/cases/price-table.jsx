// AI-generated pricing table with currency formatting issues
const PricingTable = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const plans = [
    { 
      name: 'Starter', 
      monthlyPrice: 9.99, 
      yearlyPrice: 99.99,
      features: ['10 Projects', '1GB Storage', 'Basic Support'],
      color: '#10b981'
    },
    { 
      name: 'Pro', 
      monthlyPrice: 29.99, 
      yearlyPrice: 299.99,
      features: ['Unlimited Projects', '10GB Storage', 'Priority Support', 'API Access'],
      color: '#6366f1',
      popular: true
    },
    { 
      name: 'Enterprise', 
      monthlyPrice: 99.99, 
      yearlyPrice: 999.99,
      features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Support', 'Custom Integrations'],
      color: '#8b5cf6'
    }
  ];
  
  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };
  
  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    const savings = monthlyCost - yearlyCost;
    return savings;
  };
  
  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px'
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '12px'
      }}>
        Choose Your Plan
      </h2>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px',
        gap: '8px'
      }}>
        <button
          onClick={() => setBillingCycle('monthly')}
          style={{
            padding: '8px 16px',
            backgroundColor: billingCycle === 'monthly' ? '#1f2937' : '#ffffff',
            color: billingCycle === 'monthly' ? '#ffffff' : '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer'
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          style={{
            padding: '8px 16px',
            backgroundColor: billingCycle === 'yearly' ? '#1f2937' : '#ffffff',
            color: billingCycle === 'yearly' ? '#ffffff' : '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer'
          }}
        >
          Yearly
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px'
      }}>
        {plans.map((plan, index) => (
          <div key={index} style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            border: plan.popular ? `2px solid ${plan.color}` : '1px solid #e5e7eb',
            position: 'relative',
            boxShadow: plan.popular ? `0 10px 30px ${plan.color}20` : '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: plan.color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                MOST POPULAR
              </div>
            )}
            
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: plan.color
            }}>
              {plan.name}
            </div>
            
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              `$${getPrice(plan).toFixed(2)}`
            </div>
            
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              per {billingCycle === 'monthly' ? 'month' : 'year'}
              {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                <div style={{ color: '#10b981', marginTop: '4px' }}>
                  Save `$${getSavings(plan).toFixed(2)}`/year
                </div>
              )}
            </div>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              marginBottom: '20px'
            }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{
                  padding: '8px 0',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: plan.color }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            
            <button style={{
              width: '100%',
              padding: '12px',
              backgroundColor: plan.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Component = PricingTable;