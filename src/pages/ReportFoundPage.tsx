import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CATEGORIES, CAMPUS_LOCATIONS } from '../types';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface ReportFoundPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ReportFoundPage: React.FC<ReportFoundPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<string>(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [imageUrl, setImageUrl] = useState('');
  const [storageLocation, setStorageLocation] = useState('Deposited at Gate 1 Main Security Control Room');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; matchesCount: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file size must be under 8MB.');
      return;
    }

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to report a found item.');
      return;
    }

    // Validation
    if (!title.trim() || title.trim().length < 3) {
      setError('Please provide a descriptive item title (at least 3 characters).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    if (!date) {
      setError('Please select the date the item was found.');
      return;
    }

    const finalLocation = customLocation.trim()
      ? `${location} - ${customLocation.trim()}`
      : location;

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createItem({
        type: 'found',
        title: title.trim(),
        category,
        description: description.trim(),
        location: finalLocation,
        date,
        time: time || '12:00',
        dateTime: `${date}T${time || '12:00'}`,
        imageUrl,
        storageLocation: storageLocation.trim(),
        securityQuestion: securityQuestion.trim() || undefined,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        status: 'open',
      });

      setSuccessInfo({
        id: res.item.id,
        matchesCount: res.potentialMatchesCount,
      });

      // Auto redirect to My Reports after 2.2 seconds to view newly created report
      setTimeout(() => {
        onNavigate('my-reports', { highlightId: res.item.id });
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit found item report.');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Student Session Required</h2>
        <p className="text-sm text-zinc-600 mb-4">Please log in to report a found item.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-zinc-900 text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-2 border border-emerald-400/20">
            <span>Good Samaritan Campus Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Report a Found Item</h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
            Thank you for your honesty! Log the item you recovered so its rightful owner can identify and claim it.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {successInfo ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Found Item Report Saved!</h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                Your report has been saved to the campus database. Redirecting to <strong>My Reports</strong> to view your new item...
              </p>

              {successInfo.matchesCount > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl max-w-md mx-auto text-left">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{successInfo.matchesCount} Matching Lost Reports Found!</span>
                  </div>
                  <p className="text-xs text-indigo-800 mb-3">
                    Students previously reported losing similar items in this category.
                  </p>
                  <button
                    onClick={() => onNavigate('matches', { itemId: successInfo.id })}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Matching Lost Reports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate('my-reports', { highlightId: successInfo.id })}
                  className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <span>Go to My Reports Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Item Title / Description Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Casio Scientific Calculator with Blue Cover"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  General Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe general appearance, color, brand, condition, and any accessories found with it..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                />
                <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Keep secret details (like serial number or lockscreen) hidden so claimant can prove ownership.
                  </span>
                </p>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Campus Zone Where Found <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white"
                  >
                    {CAMPUS_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Specific Room / Spot (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    placeholder="e.g. Under Table #4 in Canteen"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Date Found <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Approximate Time Found <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Current Storage Location */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Current Item Custody / Storage Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                  placeholder="e.g. Deposited at Gate 1 Main Security Office / With me in CS Department"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                />
              </div>

              {/* Secret Security Question for Claimant */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Secret Security Question for Claimant (Optional)
                </label>
                <p className="text-xs text-amber-800 mb-2">
                  Only the genuine owner should know this (e.g. "What sticker is on the backside?" or "What figure is on the keychain?").
                </p>
                <input
                  type="text"
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  placeholder="e.g. What is the keychain figure or phone lockscreen?"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Item Photo (Helps owner identify it)
                </label>
                <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-4 text-center hover:border-zinc-400 transition-colors bg-zinc-50/50">
                  {uploadingImage ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-medium">Processing and encoding image...</span>
                    </div>
                  ) : imageUrl ? (
                    <div className="space-y-3">
                      <img
                        src={imageUrl}
                        alt="Uploaded preview"
                        className="max-h-52 rounded-xl mx-auto object-cover border border-zinc-200 shadow-xs"
                      />
                      <div className="flex items-center justify-center gap-3">
                        <label className="cursor-pointer text-xs font-semibold text-emerald-600 hover:underline">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-zinc-300">•</span>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs text-rose-600 font-semibold hover:underline"
                        >
                          Remove Photo
                        </button>
                      </div>

                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-left flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold text-emerald-950 block">
                            AI Multimodal Image Embedding Ready
                          </span>
                          <span className="text-[10px] text-emerald-700 block">
                            Upon submission, this photo will be transformed into a 3072-D vector embedding (<code className="font-mono text-[9px] bg-emerald-100 px-1 py-0.5 rounded">gemini-embedding-2-preview</code>) for visual similarity matching against lost reports.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-zinc-700 block">
                        Upload photo of found item
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        PNG, JPG, JPEG up to 8MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Finder contact */}
              <div className="pt-4 border-t border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">Your Finder Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Campus Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('my-reports')}
                  className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Publish Found Item</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
