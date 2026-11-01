import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// Async thunks
export const fetchProjects = createAsyncThunk(
  "project/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/projects");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch projects"
      );
    }
  }
);

export const fetchProject = createAsyncThunk(
  "project/fetchProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project"
      );
    }
  }
);

export const createProject = createAsyncThunk(
  "project/createProject",
  async ({ name }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/projects", { name });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create project"
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "project/updateProject",
  async ({ projectId, name }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/${projectId}`, { name });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update project"
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  "project/deleteProject",
  async (projectId, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${projectId}`);
      return projectId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete project"
      );
    }
  }
);

export const linkRepo = createAsyncThunk(
  "project/linkRepo",
  async ({ projectId, githubUrl }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/github/${projectId}/link-repo`, {
        githubUrl,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to link repo"
      );
    }
  }
);

export const generateArchitecture = createAsyncThunk(
  "project/generateArchitecture",
  async ({ projectId, force = false }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/github/${projectId}/architecture`, { force });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate architecture"
      );
    }
  }
);

export const generateDependencies = createAsyncThunk(
  "project/generateDependencies",
  async ({ projectId, force = false }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/github/${projectId}/dependencies`, { force });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate dependencies"
      );
    }
  }
);

export const pollCommits = createAsyncThunk(
  "project/pollCommits",
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/github/${projectId}/poll-commits`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to poll commits"
      );
    }
  }
);

export const askQuestion = createAsyncThunk(
  "project/askQuestion",
  async ({ projectId, question }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/ask`, {
        question,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to ask question"
      );
    }
  }
);

export const fetchQuestions = createAsyncThunk(
  "project/fetchQuestions",
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/questions`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch questions"
      );
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  "project/deleteQuestion",
  async (questionId, { rejectWithValue }) => {
    try {
      await api.delete(`/questions/${questionId}`);
      return questionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete question"
      );
    }
  }
);

export const saveNote = createAsyncThunk(
  "project/saveNote",
  async ({ projectId, text }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/${projectId}/note`, { text });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save note"
      );
    }
  }
);

export const processMeeting = createAsyncThunk(
  "project/processMeeting",
  async ({ projectId, audio_url }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/meetings`, {
        audio_url,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to process meeting"
      );
    }
  }
);

export const fetchMeetings = createAsyncThunk(
  "project/fetchMeetings",
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/meetings`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch meetings"
      );
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  "project/deleteMeeting",
  async (meetingId, { rejectWithValue }) => {
    try {
      await api.delete(`/meetings/${meetingId}`);
      return meetingId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete meeting"
      );
    }
  }
);

export const inviteUser = createAsyncThunk(
  "project/inviteUser",
  async ({ projectId, email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/invite`, {
        email,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to invite user"
      );
    }
  }
);

const initialState = {
  projects: [],
  currentProject: null,
  questions: [],
  meetings: [],
  isLoading: false,
  architectureGraph: null,
  dependencyGraph: null,
  isArchitectureLoading: false,
  isDependencyLoading: false,
  architectureError: null,
  dependencyError: null,
  isActionLoading: false,
  error: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // Generate Architecture
      .addCase(generateArchitecture.pending, (state) => {
        state.isArchitectureLoading = true;
        state.architectureError = null;
      })
      .addCase(generateArchitecture.fulfilled, (state, action) => {
        state.isArchitectureLoading = false;
        state.architectureGraph = action.payload;
        if (state.currentProject) {
          state.currentProject.architectureGraph = action.payload;
        }
      })
      .addCase(generateArchitecture.rejected, (state, action) => {
        state.isArchitectureLoading = false;
        state.architectureError = action.payload;
      })
      // Generate Dependencies
      .addCase(generateDependencies.pending, (state) => {
        state.isDependencyLoading = true;
        state.dependencyError = null;
      })
      .addCase(generateDependencies.fulfilled, (state, action) => {
        state.isDependencyLoading = false;
        state.dependencyGraph = action.payload;
        if (state.currentProject) {
          state.currentProject.dependencyGraph = action.payload;
        }
      })
      .addCase(generateDependencies.rejected, (state, action) => {
        state.isDependencyLoading = false;
        state.dependencyError = action.payload;
      })

      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Project
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Project
      .addCase(createProject.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
        state.projects = state.projects.map((p) =>
          p._id === action.payload._id ? { ...p, name: action.payload.name } : p
        );
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Link Repo
      .addCase(linkRepo.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(linkRepo.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
      })
      .addCase(linkRepo.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Poll Commits
      .addCase(pollCommits.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(pollCommits.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
      })
      .addCase(pollCommits.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Ask Question
      .addCase(askQuestion.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.questions.unshift(action.payload);
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Fetch Questions
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
      })
      // Delete Question
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter(
          (q) => q._id !== action.payload
        );
      })
      // Save Note
      .addCase(saveNote.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
      })
      // Process Meeting
      .addCase(processMeeting.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(processMeeting.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.meetings.unshift(action.payload);
      })
      .addCase(processMeeting.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })
      // Fetch Meetings
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.meetings = action.payload;
      })
      // Delete Meeting
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.meetings = state.meetings.filter(
          (m) => m._id !== action.payload
        );
      })
      // Invite User
      .addCase(inviteUser.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.architectureGraph = action.payload.architectureGraph || null;
        state.dependencyGraph = action.payload.dependencyGraph || null;
      });
  },
});

export const { setCurrentProject, clearError } = projectSlice.actions;
export default projectSlice.reducer;
