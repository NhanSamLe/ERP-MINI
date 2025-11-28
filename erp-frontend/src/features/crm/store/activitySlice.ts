import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { isRejected, isPending } from "@reduxjs/toolkit";
import * as service from "../service/activity.service";
import {
  CreateCallActivityDto,
  CreateEmailActivityDto,
  CreateMeetingActivityDto,
  CreateTaskActivityDto,
  UpdateActivityDto,
  UpdateCallDetailDto,
  UpdateEmailDetailDto,
  UpdateMeetingDetailDto,
  UpdateTaskDetailDto,
  Activity,
} from "../dto/activity.dto";

/* =============================
    1. Redux State
============================== */

interface ActivityState {
  all: Activity[];          // Tất cả activity
  mine: Activity[];         // Activity của tôi
  today: Activity[];        // Activity hôm nay
  related: Activity[];      // Activity theo Lead/Opp/Customer
  detail: Activity | null;  // Chi tiết activity

  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  all: [],
  mine: [],
  today: [],
  related: [],
  detail: null,
  loading: false,
  error: null,
};

/* =============================
    2. Async Actions (Thunk)
============================== */

// --- GET LIST ---
export const fetchAllActivities = createAsyncThunk(
  "activity/fetchAll",
  async () => {
    return await service.getAllActivities();
  }
);

export const fetchMyActivities = createAsyncThunk(
  "activity/fetchMine",
  async () => {
    return await service.getMyActivities();
  }
);

export const fetchTodayActivities = createAsyncThunk(
  "activity/fetchToday",
  async () => {
    return await service.getTodayActivities();
  }
);

export const fetchActivitiesFor = createAsyncThunk(
  "activity/fetchFor",
  async (params: { type: string; id: number }) => {
    return await service.getActivitiesFor(params.type, params.id);
  }
);

// --- GET DETAIL (tự phân loại) ---
export const fetchActivityDetail = createAsyncThunk(
  "activity/fetchDetail",
  async (params: {id: number}) => {
      return await service.getActivityDetail(params.id);
    }
);

// --- CREATE ---
export const createCallActivity = createAsyncThunk(
  "activity/createCall",
  async (data: CreateCallActivityDto) => await service.createCallActivity(data)
);

export const createEmailActivity = createAsyncThunk(
  "activity/createEmail",
  async (data: CreateEmailActivityDto) => await service.createEmailActivity(data)
);

export const createMeetingActivity = createAsyncThunk(
  "activity/createMeeting",
  async (data: CreateMeetingActivityDto) => await service.createMeetingActivity(data)
);

export const createTaskActivity = createAsyncThunk(
  "activity/createTask",
  async (data: CreateTaskActivityDto) => await service.createTaskActivity(data)
);

// --- UPDATE ---
export const updateActivity = createAsyncThunk(
  "activity/update",
  async (data: UpdateActivityDto) => await service.updateActivity(data)
);

export const updateCallDetail = createAsyncThunk(
  "activity/updateCallDetail",
  async (params: { activityId: number; data: UpdateCallDetailDto }) => {
    return await service.updateCallDetail(params.activityId, params.data);
  }
);

export const updateEmailDetail = createAsyncThunk(
  "activity/updateEmailDetail",
  async (params: { activityId: number; data: UpdateEmailDetailDto }) => {
    return await service.updateEmailDetail(params.activityId, params.data);
  }
);

export const updateMeetingDetail = createAsyncThunk(
  "activity/updateMeetingDetail",
  async (params: { activityId: number; data: UpdateMeetingDetailDto }) => {
    return await service.updateMeetingDetail(params.activityId, params.data);
  }
);

export const updateTaskDetail = createAsyncThunk(
  "activity/updateTaskDetail",
  async (params: { activityId: number; data: UpdateTaskDetailDto }) => {
    return await service.updateTaskDetail(params.activityId, params.data);
  }
);

// --- DELETE ---
export const deleteActivity = createAsyncThunk(
  "activity/delete",
  async (id: number) => {
    await service.deleteActivity(id);
    return id;
  }
);

export const startTask = createAsyncThunk(
  "activity/startTask",
  async (activityId: number) => {
    return await service.startTask(activityId);
  }
);

export const completeTask = createAsyncThunk(
  "activity/completeTask",
  async (activityId: number) => {
    return await service.completeTask(activityId);
  }
);
export const completeActivity = createAsyncThunk(
  "activity/completeActivity",
  async (params: { activityId: number; notes?: string }) => {
    return await service.completeActivity(params.activityId, params.notes);
  }
);
/* =============================
    3. Slice
============================== */

export const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    clearActivityDetail: (state) => {
      state.detail = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* =============================
          FETCH LIST
      ============================== */
      .addCase(fetchAllActivities.fulfilled, (state, action) => {
        state.all = action.payload;
        state.loading = false;
      })
      .addCase(fetchMyActivities.fulfilled, (state, action) => {
        state.mine = action.payload;
        state.loading = false;
      })
      .addCase(fetchTodayActivities.fulfilled, (state, action) => {
        state.today = action.payload;
        state.loading = false;
      })
      .addCase(fetchActivitiesFor.fulfilled, (state, action) => {
        state.related = action.payload;
        state.loading = false;
      })

      /* =============================
          DETAIL
      ============================== */
      .addCase(fetchActivityDetail.fulfilled, (state, action) => {
        state.detail = action.payload ?? null;
        state.loading = false;
      })

      /* =============================
          CREATE
      ============================== */
      .addCase(createCallActivity.fulfilled, (state, action) => {
        state.all.unshift(action.payload);
      })
      .addCase(createEmailActivity.fulfilled, (state, action) => {
        state.all.unshift(action.payload);
      })
      .addCase(createMeetingActivity.fulfilled, (state, action) => {
        state.all.unshift(action.payload);
      })
      .addCase(createTaskActivity.fulfilled, (state, action) => {
        state.all.unshift(action.payload);
      })

      /* =============================
          UPDATE
      ============================== */
      .addCase(updateActivity.fulfilled, (state, action) => {
        state.detail = action.payload;
      })
      .addCase(startTask.fulfilled, (state) => {
        if (state.detail?.task) {
            state.detail.task.status = "In Progress";
        }
        })

        .addCase(completeTask.fulfilled, (state) => {
        if (state.detail) {
            state.detail.done = true;
            state.detail.completed_at = new Date().toISOString();
        }
        if (state.detail?.task) {
            state.detail.task.status = "Completed";
        }
        })
        .addCase(completeActivity.fulfilled, (state, action) => {
        const updated = action.payload;
        state.detail = updated;

        state.all = state.all.map((a) => (a.id === updated.id ? updated : a));
        state.mine = state.mine.map((a) => (a.id === updated.id ? updated : a));
        state.today = state.today.map((a) => (a.id === updated.id ? updated : a));
        state.related = state.related.map((a) => (a.id === updated.id ? updated : a));

        state.loading = false;
      })

        // Update call/email/meeting/task detail
        .addCase(updateCallDetail.fulfilled, (state, action) => {
        if (state.detail) state.detail.call = action.payload;
        })

        .addCase(updateEmailDetail.fulfilled, (state, action) => {
        if (state.detail) state.detail.email = action.payload;
        })

        .addCase(updateMeetingDetail.fulfilled, (state, action) => {
        if (state.detail) state.detail.meeting = action.payload;
        })

        .addCase(updateTaskDetail.fulfilled, (state, action) => {
        if (state.detail) state.detail.task = action.payload;
        })

      /* =============================
          DELETE
      ============================== */
      .addCase(deleteActivity.fulfilled, (state, action) => {
        const id = action.payload;

        state.all = state.all.filter((a) => a.id !== id);
        state.mine = state.mine.filter((a) => a.id !== id);
        state.today = state.today.filter((a) => a.id !== id);
        state.related = state.related.filter((a) => a.id !== id);

        if (state.detail?.id === id) state.detail = null;
      })

      /* =============================
          LOADING + ERROR
      ============================== */
     .addMatcher(isPending, (state) => {
        state.loading = true;
        state.error = null;
        })

        .addMatcher(isRejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Lỗi không xác định";
        });

  },
});

export const { clearActivityDetail } = activitySlice.actions;

export default activitySlice.reducer;
