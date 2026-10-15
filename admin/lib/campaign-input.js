'use strict';

const constants = require('./constants');

const { NAME_MIN_LENGTH, NAME_MAX_LENGTH, MAX_COMMENTS, COMMENT_MAX_LENGTH } = constants.CAMPAIGN;

/**
 * Validate and normalise a campaign payload.
 * When `partial` is true, only the provided fields are validated/returned
 * (used for PATCH updates).
 *
 * @returns {{ error: string|null, data: object }}
 */
function parseCampaignInput(body, { partial = false } = {}) {
    const source = body && typeof body === 'object' ? body : {};
    const data = {};

    if (!partial || source.name !== undefined) {
        const name = (source.name === undefined || source.name === null ? '' : String(source.name)).trim();

        if (!name) {
            return { error: 'Campaign name is required.', data: null };
        };

        if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
            return { error: `Campaign name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`, data: null };
        };

        data.name = name;
    };

    if (!partial || source.rewards !== undefined) {
        if (source.rewards === undefined || source.rewards === null || String(source.rewards).trim() === '') {
            return { error: 'Rewards is required.', data: null };
        };

        const rewards = Number(source.rewards);

        if (!Number.isFinite(rewards) || rewards < 0) {
            return { error: 'Rewards must be a valid non-negative number.', data: null };
        };

        data.rewards = rewards;
    };

    if (source.comments !== undefined) {
        if (!Array.isArray(source.comments)) {
            return { error: 'Comments must be a list.', data: null };
        };

        const comments = source.comments
            .map((comment) => (comment === undefined || comment === null ? '' : String(comment)).trim())
            .filter((comment) => comment !== '');

        if (comments.length > MAX_COMMENTS) {
            return { error: `A campaign can have at most ${MAX_COMMENTS} comments.`, data: null };
        };

        const tooLong = comments.find((comment) => comment.length > COMMENT_MAX_LENGTH);
        if (tooLong) {
            return { error: `Each comment must be at most ${COMMENT_MAX_LENGTH} characters.`, data: null };
        };

        data.comments = comments;
    } else if (!partial) {
        data.comments = [];
    };

    return { error: null, data };
};

module.exports = { parseCampaignInput };
