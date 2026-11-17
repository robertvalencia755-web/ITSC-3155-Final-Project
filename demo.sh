#!/usr/bin/env bash
# CourseLens API demo. Run from anywhere: ./demo.sh
# Starts the database container and the server if they are not already up, then
# walks through the API one request at a time (press Enter between steps).
set -u
cd "$(dirname "$0")/server"
BASE=http://localhost:3000

podman start courselens-db >/dev/null 2>&1
if ! curl -sf $BASE/health >/dev/null; then
  echo "Starting server..."
  (npm run dev >/tmp/courselens-server.log 2>&1 &)
  for _ in $(seq 20); do curl -sf $BASE/health >/dev/null && break; sleep 1; done
fi

pretty() { if command -v jq >/dev/null; then jq -C "${1:-.}"; else cat; fi; }
step() {
  echo; echo "=== $1"; echo "\$ curl $BASE$2"
  read -r -p "(Enter to run) " _
  curl -s ${3:-} "$BASE$2" ${4:-} | pretty "${5:-.}"
}

step "Health check" /health
step "Departments (filter dropdown)" /api/departments
step "Catalogue: every course with review averages" /api/courses "" "" '.[0:3]'
step "Catalogue search: 'okafor'" "/api/courses?q=okafor" "" "" '.[] | {course_code, course_name, avg_rating}'
step "Course page: one course, its professors, averages" /api/courses/2
step "Course page: reviews, newest first" /api/courses/2/reviews
step "Professor with the courses they teach" /api/professors/1
step "Profile: user and review count (no email or password)" /api/users/1

echo; echo "=== POST a new review"
BODY='{"user_id":4,"professor_id":3,"course_id":4,"overall_rating":4,"difficulty":3,"usefulness":5,"grade":"A","semester":"Fall 2026","textbook_used":false,"workload":"Moderate","skills":["Git","TypeScript"],"time_commitment":5.5,"review_text":"Communicate with your team early."}'
echo "\$ curl -X POST $BASE/api/reviews -H 'Content-Type: application/json' -d '$BODY'"
read -r -p "(Enter to run) " _
curl -s -X POST $BASE/api/reviews -H 'Content-Type: application/json' -d "$BODY" | pretty

echo; echo "=== Same POST with a bad rating (validation rejects it)"
BAD=${BODY/\"overall_rating\":4/\"overall_rating\":9}
read -r -p "(Enter to run) " _
curl -s -w '\nHTTP %{http_code}\n' -X POST $BASE/api/reviews -H 'Content-Type: application/json' -d "$BAD"

echo; echo "Reset sample data afterwards: (cd server && npm run db:seed)"
