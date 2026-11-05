import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { msg } from './api';

const call = (name, url) => createAsyncThunk(name, async (body, { rejectWithValue }) => { try { return (await api.post(url, body)).data; } catch (e) { return rejectWithValue(msg(e)); } });
export const login = call('auth/login', '/auth/login');
export const signup = call('auth/signup', '/auth/signup');
const saved = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const slice = createSlice({
  name: 'auth',
  initialState: { user: saved(), token: localStorage.getItem('token'), loading: false, error: null },
  reducers: { logout(s) { s.user = null; s.token = null; localStorage.clear(); } },
  extraReducers: (b) => {
    for (const t of [login, signup]) {
      b.addCase(t.pending, (s) => { s.loading = true; s.error = null; })
        .addCase(t.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload.user; s.token = payload.token; localStorage.setItem('token', payload.token); localStorage.setItem('user', JSON.stringify(payload.user)); })
        .addCase(t.rejected, (s, { payload }) => { s.loading = false; s.error = payload; });
    }
  }
});
export const { logout } = slice.actions;
export default slice.reducer;
