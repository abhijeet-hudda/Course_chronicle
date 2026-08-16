import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { signupApi, loginApi, logoutApi, getProfileApi } from "../api/auth.api";

const initialState = {
  userId: null,
  name: null,
  email: null,
  credit: null,
  refCode: null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  // false until the initial "am I still logged in" check (fetchProfile on
  // app boot) has resolved one way or the other. Prevents a flash of the
  // logged-out UI on refresh while that request is in flight.
  authChecked: false,
};

export const signup = createAsyncThunk("auth/signup", async (payload, { rejectWithValue }) => {
  try {
    const envelope = await signupApi(payload);
    console.log("signup data :",envelope.data);
    return envelope.data; // { userId, token, credit, refCode }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Signup failed");
  }
});

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const envelope = await loginApi(payload);
    return envelope.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await logoutApi();
  } catch {
    // Clear local state regardless — an errored logout call shouldn't leave
    // the UI stuck showing a "logged in" state the cookie no longer backs.
  }
});

// Called once when the app boots. The JWT lives in an httpOnly cookie the
// frontend can't read directly, so this is how we find out whether the
// visitor already has a valid session (e.g. after a page refresh).
export const fetchProfile = createAsyncThunk("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const envelope = await getProfileApi();
    return envelope.data; // full User document (minus Password)
  } catch {
    return rejectWithValue(null);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateCredit(state, action) {
      state.credit = action.payload;
    },
    clearUser(state) {
      state.userId = null;
      state.name = null;
      state.email = null;
      state.credit = null;
      state.refCode = null;
      state.status = "idle";
      state.authChecked = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userId = action.payload.userId;
        state.credit = action.payload.credit;
        state.refCode = action.payload.refCode;
        state.authChecked = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userId = action.payload.userId;
        state.credit = action.payload.credit;
        state.refCode = action.payload.refCode;
        state.authChecked = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.userId = null;
        state.name = null;
        state.email = null;
        state.credit = null;
        state.refCode = null;
        state.status = "idle";
        state.authChecked = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.userId = action.payload._id;
        state.name = action.payload.Name;
        state.email = action.payload.Email;
        state.credit = action.payload.Credit;
        state.refCode = action.payload.RefCode;
        state.authChecked = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        // No valid cookie / not logged in — that's a normal state, not an error.
        state.userId = null;
        state.authChecked = true;
      });
  },
});

export const { updateCredit, clearUser } = authSlice.actions;
export default authSlice.reducer;
