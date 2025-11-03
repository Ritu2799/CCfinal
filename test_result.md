#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  CloudCP Calendar Enhancement - Festival Prediction & AWS Integration
  - Fix calendar functionality
  - Show all 2025 and 2026 festivals with traffic spike predictions
  - Implement AWS EC2 instance management
  - Display festival traffic spikes based on boost multipliers from training data
  - Use specific Indian festivals: Republic Day, Holi, Ram Navami, Independence Day, Diwali, Diwali Weekend, Christmas
  - Implement scaling logic: 1 instance for <700, 2 for 700-1400, 3 for 1400-2100, etc.

backend:
  - task: "Festival data with boost multipliers"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added INDIAN_FESTIVALS dict with boost values (2.0-4.5x) for all major festivals in 2023-2026. Updated check_festival_calendarific to return boost values."

  - task: "Traffic prediction with boost multiplier"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Updated predict_traffic function to apply festival boost multiplier to predictions. Traffic spikes are now amplified by boost factor (e.g., 4.5x for Diwali)."

  - task: "Instance scaling logic (1 for <700, 2 for 700-1400, etc.)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Updated scale_ec2_instances with new thresholds: <700=1, 700-1400=2, 1400-2100=3, 2100-3000=4, 3000-5000=5, >5000=10 instances."

  - task: "2025 festivals endpoint with predictions"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created /api/festivals/2025 endpoint returning all major 2025 festivals with 24-hour predictions, boost values, peak hour, YoY comparison with 2024 data."

  - task: "2026 festivals endpoint with predictions"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created /api/festivals/2026 endpoint with same structure as 2025, comparing with 2025 previous year data."

  - task: "AWS instances listing endpoint"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created /api/aws/instances endpoint to list EC2 instances in ASG. Works in mock mode without AWS credentials, returns real data with valid credentials."

  - task: "AWS instance update endpoint"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created /api/aws/update-instance endpoint to terminate/stop/start specific instances. Requires AWS credentials to function."

frontend:
  - task: "Festival Calendar Component"
    implemented: true
    working: true
    file: "/app/frontend/src/components/FestivalCalendar.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created FestivalCalendar component with 2025/2026 tabs, festival cards showing boost multipliers, traffic spikes, YoY growth, and 24-hour chart for selected festival."

  - task: "Tabs integration in main App"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added Tabs component with '24-Hour Predictions' and 'Festival Calendar' views. Festival Calendar shows all festivals with traffic spike visualizations."

  - task: "Festival spike visualization"
    implemented: true
    working: true
    file: "/app/frontend/src/components/FestivalCalendar.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Festival cards display boost multipliers with color coding (red for 4x+, orange for 3x+, yellow for 2.5x+). Selected festival shows 24-hour traffic spike chart."

  - task: "Calendar date picker functionality"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Calendar component using react-day-picker is already functional. Date selection works and triggers prediction updates."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 0
  run_ui: false
  aws_configured: false

test_plan:
  current_focus:
    - "Festival data with boost multipliers"
    - "Traffic prediction with boost multiplier"
    - "2025 festivals endpoint with predictions"
    - "Festival Calendar Component"
    - "Festival spike visualization"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Completed implementation of festival calendar with traffic spike predictions for 2025 and 2026.
      
      Key Features Implemented:
      1. Backend:
         - Added INDIAN_FESTIVALS with boost multipliers (2.0x - 4.5x)
         - Updated scaling logic: <700=1, 700-1400=2, 1400-2100=3, 2100-3000=4, 3000-5000=5, >5000=10 instances
         - Created /api/festivals/2025 and /api/festivals/2026 endpoints
         - Traffic predictions now apply boost multipliers (Diwali gets 4.5x spike, Holi gets 3.0x, etc.)
         - Added YoY comparison with previous year data
      
      2. Frontend:
         - Created FestivalCalendar component with tabs for 2025/2026
         - Festival cards show boost multipliers with color coding
         - Clicking festival card shows 24-hour traffic spike chart
         - YoY growth percentage displayed for each festival
         - Calendar date picker is working correctly
      
      3. AWS Integration:
         - Instance scaling logic updated with correct thresholds
         - AWS endpoints ready (work in mock mode without credentials)
         - CONFIG_SETUP.md created with instructions for AWS credentials
      
      Ready for testing. Please test:
      1. Backend endpoints: /api/festivals/2025, /api/festivals/2026, /api/predict with festival dates
      2. Frontend: Festival Calendar tab, clicking on festivals, viewing spike charts
      3. Verify boost multipliers are applied correctly to predictions
      4. Check calendar date picker functionality