import React from 'react';
import { createRoot } from 'react-dom/client';

function CourseStats() {
    const statistics = [
        {
            title: 'Overall Rating',
            value: '3.0 / 5',
            description: 'Average student rating',
            percentage: 60
        },
        {
            title: 'Difficulty',
            value: '3.5 / 5',
            description: 'Average difficulty',
            percentage: 70
        },
        {
            title: 'Weekly Workload',
            value: '4 hrs',
            description: 'Average time commitment',
            percentage: 40
        },
        {
            title: 'Usefulness',
            value: '4.2 / 5',
            description: 'Average usefulness rating',
            percentage: 84
        }
    ];

    return (
        <div className="stats-grid">
            {statistics.map((statistic) => (
                <div className="stat-card" key={statistic.title}>
                    <div className="stat-heading">
                        <h3>{statistic.title}</h3>
                        <strong>{statistic.value}</strong>
                    </div>

                    <div className="stat-bar">
                        <div
                            className="stat-bar-fill"
                            style={{ width: `${statistic.percentage}%` }}
                        ></div>
                    </div>

                    <p>{statistic.description}</p>
                </div>
            ))}
        </div>
    );
}

const statsContainer = document.getElementById('course-stats');

if (statsContainer) {
    createRoot(statsContainer).render(<CourseStats />);
}
