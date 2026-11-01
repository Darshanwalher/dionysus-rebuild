const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    githubUrl: {
      type: String,
      default: null,
    },
    documentation: {
      type: String,
      default: null,
    },
    mermaidGraph: {
      type: String,
      default: null,
    },
    architectureGraph: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    dependencyGraph: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for commits
projectSchema.virtual('commits', {
  ref: 'Commit',
  localField: '_id',
  foreignField: 'project',
});

// Virtual populate for meetings
projectSchema.virtual('meetings', {
  ref: 'Meeting',
  localField: '_id',
  foreignField: 'project',
});

// Virtual populate for questions
projectSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'project',
});

module.exports = mongoose.model('Project', projectSchema);
