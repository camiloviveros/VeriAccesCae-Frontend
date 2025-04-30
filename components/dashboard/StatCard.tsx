export type StatCardProps = {
    title: string;
    value: number | string;
    icon?: React.ReactNode;
    change?: number;
    changeText?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
  };
  
  export default function StatCard({ 
    title, 
    value, 
    icon, 
    change, 
    changeText,
    changeType = 'neutral' 
  }: StatCardProps) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            {icon && (
              <div className="flex-shrink-0 mr-4">
                {icon}
              </div>
            )}
            <div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">
                {value}
              </div>
              <p className="text-sm font-medium text-gray-500 truncate">
                {title}
              </p>
            </div>
          </div>
          
          {(change !== undefined || changeText) && (
            <div className="mt-4">
              <div className={`
                inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium
                ${changeType === 'increase' ? 'bg-green-100 text-green-800' : 
                  changeType === 'decrease' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'}
              `}>
                {change !== undefined && (
                  <span className="mr-1">
                    {changeType === 'increase' && '+'}
                    {change}%
                  </span>
                )}
                {changeText && (
                  <span className="sr-only sm:not-sr-only">
                    {changeText}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }