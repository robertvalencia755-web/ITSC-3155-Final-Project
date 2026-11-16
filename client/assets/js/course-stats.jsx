
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const API_URL = "http://localhost:3000/api";

function CourseStats() {
    const [course, setCourse] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const courseId = new URLSearchParams(window.location.search).get("id");

        if (!courseId || !/^\d+$/.test(courseId)) {
            setError("Invalid or missing course ID.");
            setLoading(false);
            return;
        }

        async function loadStatistics() {
            try {
                const response = await fetch(`${API_URL}/courses/${courseId}`);

                if (!response.ok) {
                    throw new Error("Unable to load course statistics.");
                }

                const courseData = await response.json();
                setCourse(courseData);
            } catch (error) {
                console.error("Error loading course statistics:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadStatistics();
    }, []);

    if (loading) {
        return <p>Loading course statistics...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    const formatRating = (value) => {
        return value == null
            ? "N/A"
            : `${Number(value).toFixed(1)} / 5`;
    };

    const getPercentage = (value) => {
        if (value == null) {
            return null;
        }

        return Math.min(100, Math.max(0, (Number(value) / 5) * 100));
    };

    const statistics = [
        {
            title: "Overall Rating",
            value: formatRating(course.avg_rating),
            description: "Average student rating",
            percentage: getPercentage(course.avg_rating)
        },
        {
            title: "Difficulty",
            value: formatRating(course.avg_difficulty),
            description: "Average difficulty",
            percentage: getPercentage(course.avg_difficulty)
        },
        {
            title: "Weekly Workload",
            value: course.avg_time_commitment == null
                ? "N/A"
                : `${Number(course.avg_time_commitment).toFixed(1)} hrs`,
            description: "Average weekly time commitment",
            percentage: null
        },
        {
            title: "Usefulness",
            value: formatRating(course.avg_usefulness),
            description: "Average usefulness rating",
            percentage: getPercentage(course.avg_usefulness)
        }
    ];

    return (
        <>
            <div className="stats-grid">
                {statistics.map((statistic) => (
                    <div className="stat-card" key={statistic.title}>
                        <div className="stat-heading">
                            <h3>{statistic.title}</h3>
                            <strong>{statistic.value}</strong>
                        </div>

                        {statistic.percentage !== null && (
                            <div className="stat-bar">
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${statistic.percentage}%`
                                    }}
                                ></div>
                            </div>
                        )}

                        <p>{statistic.description}</p>
                    </div>
                ))}
            </div>

            <p className="review-count">
                Based on {Number(course.review_count) || 0} student reviews
            </p>
        </>
    );
}

const statsContainer = document.getElementById("course-stats");

if (statsContainer) {
    createRoot(statsContainer).render(<CourseStats />);
}
