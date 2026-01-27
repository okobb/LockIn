<img src="./readme/titles/title1.svg"/>

<br><br>

## License

do
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<br><br>

<!-- project overview -->
<img src="./readme/titles/title2.svg"/>

> Lock In is an AI-powered productivity operating system designed to centralize your work, manage your focus, and turn noise into signal. By combining intelligent **Context Snapshots** for seamless task switching, advanced **Time Management** tools, and an AI-driven **Resource Hub**, LockIn ensures you never lose your flow state.

<br><br>

<!-- system design -->
<img src="./readme/titles/title3.svg"/>

## System Design

<img src="./readme/System Design/System Design.png"/>

## Entity Relationship Diagram

<img src="./readme/System Design/ERD.png"/>

## n8n Workflows

<img src="./readme/System Design/n8n.png"/>

<br><br>

<img src="./readme/titles/title4.svg">

## Key Features

- **Context Snapshots**: Instantly saves and restores your entire workspace—including open browser tabs, and active Git branches—so you can switch tasks without losing context.

- **RAG-Powered Second Brain**: A "Talk to Your Data" engine that indexes your personal docs and logs into a vector database, allowing the AI to give grounded answers specific to your work.

- **Bayesian Noise Filter**: A high-performance Go microservice that learns from your behavior to automatically classify notifications as "Important" or "Noise," protecting your focus.

- **Active Flow Coach**: An embedded AI agent that doesn't just chat but actively unblocks you by generating dynamic checklists and pulling relevant documentation while you work.

<br>

<img src="./readme/Highlights/highlights.png"/>

<br><br>

<!-- Demo -->
<img src="./readme/titles/title5.svg"/>

## User Screens & Demos

|                       Landing (Dark)                        |                       Landing (Light)                        |
| :---------------------------------------------------------: | :----------------------------------------------------------: |
| <img src="./readme/Screens/Landing Dark.gif" width="400" /> | <img src="./readme/Screens/Landing Light.gif" width="375" /> |

|                        Onboarding                         |                       Dashboard (Dark)                        |
| :-------------------------------------------------------: | :-----------------------------------------------------------: |
| <img src="./readme/Screens/Onboarding.gif" width="400" /> | <img src="./readme/Screens/Dashboard dark.png" width="400" /> |

|                       Dashboard (Light)                        |                       Dashboard (with Items)                        |
| :------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="./readme/Screens/Dashboard light.png" width="400" /> | <img src="./readme/Screens/Dashboard with items.png" width="400" /> |

|                  Calendar (with Data)                   |                       Calendar (Empty)                        |
| :-----------------------------------------------------: | :-----------------------------------------------------------: |
| <img src="./readme/Screens/Calendar.gif" width="400" /> | <img src="./readme/Screens/Calendar Empty.png" width="400" /> |

|                       Stats (with Data)                       |                       Stats (Empty)                        |
| :-----------------------------------------------------------: | :--------------------------------------------------------: |
| <img src="./readme/Screens/Sats with data.png" width="400" /> | <img src="./readme/Screens/Stats Empty.png" width="400" /> |

|                  Context History (with Data)                   |                       Context History (Empty)                        |
| :------------------------------------------------------------: | :------------------------------------------------------------------: |
| <img src="./readme/Screens/Context History.gif" width="400" /> | <img src="./readme/Screens/Context History Empty.png" width="400" /> |

|                        Save Context                         |                  Resource Hub (with Data)                   |
| :---------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="./readme/Screens/Save Context.gif" width="400" /> | <img src="./readme/Screens/Resource Hub.png" width="400" /> |

|                      Resource Hub (with Data)                       |                       Resource Hub (Empty)                        |
| :-----------------------------------------------------------------: | :---------------------------------------------------------------: |
| <img src="./readme/Screens/Resource Hub Details.png" width="400" /> | <img src="./readme/Screens/Resource Hub Empty.png" width="400" /> |

|                       Resource Hub (Image)                        |                        AI Chatbot                         |
| :---------------------------------------------------------------: | :-------------------------------------------------------: |
| <img src="./readme/Screens/Image Resource Hub.png" width="400" /> | <img src="./readme/Screens/AI Chatbot.gif" width="400" /> |

<br><br>

<!-- development and testing -->
<img src="./readme/titles/title6.svg">

## Development & Implementation

### Services & Validation

|                     Services                     |                     Validation                     |                  Testing                   |
| :----------------------------------------------: | :------------------------------------------------: | :----------------------------------------: |
| ![Services](./readme/Development/Controller.PNG) | ![Validation](./readme/Development/Validation.png) | ![Testing](./readme/Development/Tests.png) |

<br><br>

### RAG AI Assistant

The AI assistant is powered by a Retrieval-Augmented Generation (RAG) pipeline. User resources are chunked, embedded using OpenAI embeddings, and stored in a Qdrant vector database for semantic search. The assistant uses OpenAI function calling to execute tools like creating tasks or listing resources.

|             Knowledge Chunks (Database)              |             RAG Assistant Tools             |
| :--------------------------------------------------: | :-----------------------------------------: |
| ![Chunks](./readme/Development/Knowledge_Chunks.png) | ![Tools](./readme/Development/AI_Tools.png) |

<br><br>

### Integrations & Message Processing

Users can authenticate with **Google** or **GitHub** for seamless login. Connected integrations like **Slack** and **Gmail** allow the system to receive messages, which are processed through an n8n automation workflow.

|             n8n Workflow             |
| :----------------------------------: |
| ![n8n](./readme/Development/n8n.png) |

<br><br>

### ML Message Classification

A Go-based microservice uses Bayesian classification to filter incoming messages as **Important** or **Noise**, protecting focus time by surfacing only what matters.

|              Important Classification               |            Noise Classification             |
| :-------------------------------------------------: | :-----------------------------------------: |
| ![Important](./readme/Development/ML_Important.png) | ![Noise](./readme/Development/ML_Noise.png) |

<br><br>

<!-- deployment -->
<img src="./readme/titles/title7.svg">

## Deployment

### GitHub Actions

|             CI Tests              |             CD Deploy             |
| :-------------------------------: | :-------------------------------: |
| ![CI](./readme/Deployment/CI.png) | ![CD](./readme/Deployment/CD.png) |

<br><br>

### API Validation

Production API endpoints validated via Postman to ensure the deployed service is operational.
| User Login | Create Task | View Tasks |
| :----------: | :--------------: | :--------------: |
| ![Health](./readme/Deployment/Login.png) | ![User Login](./readme/Deployment/Create_Task.png) | ![API](./readme/Deployment/Get_Tasks.png) |
